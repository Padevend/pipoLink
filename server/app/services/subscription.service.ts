import { prisma } from "../../config/database.js";
import { AiTokenService } from "./ai-token.service.js";
import { PaymentService } from "./payment.service.js";

export class SubscriptionService {
  private aiTokenService = new AiTokenService();
  private paymentService = new PaymentService();

  async getSubscription(userId: string) {
    let sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!sub) {
      sub = await prisma.subscription.create({ data: { user_id: userId, plan: "FREE", status: "ACTIVE" } });
    }
    return sub;
  }

  async setAutoRenew(userId: string, autoRenew: boolean) {
    return prisma.subscription.update({ where: { user_id: userId }, data: { autoRenew } });
  }

  async processAutoRenewals() {
    const now = new Date();
    const renewBefore = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const candidates = await prisma.subscription.findMany({
      where: { plan: "PREMIUM", status: "ACTIVE", autoRenew: true, currentPeriodEnd: { gt: now, lte: renewBefore } },
      include: { user: { include: { profile: true, payments: { where: { status: "SUCCESS" }, orderBy: { createdAt: "desc" }, take: 1 } } } },
    });
    for (const sub of candidates) {
      const phone = sub.user.profile?.phone;
      const provider = sub.user.payments[0]?.provider;
      if (!phone || !provider) {
        await prisma.auditLog.create({ data: { user_id: sub.user_id, action: "SUBSCRIPTION_RENEWAL_NEEDS_PAYMENT_METHOD" } });
        continue;
      }
      const existingRenewal = await prisma.payment.findFirst({ where: { subscription_id: sub.id, status: "PENDING", createdAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) } } });
      if (existingRenewal) continue;
      try {
        await this.paymentService.initiatePayment(sub.user_id, undefined, provider, phone);
        await prisma.auditLog.create({ data: { user_id: sub.user_id, action: "SUBSCRIPTION_RENEWAL_INITIATED" } });
      } catch (error) {
        console.error(`[subscription-renewal] ${sub.user_id}`, error);
      }
    }
  }

  async checkExpirations() {
    await this.processAutoRenewals();
    const expired = await prisma.subscription.findMany({
      where: {
        plan: "PREMIUM",
        status: "ACTIVE",
        currentPeriodEnd: { lt: new Date() }
      },
      include: { user: true }
    });

    for (const sub of expired) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { plan: "FREE", status: "EXPIRED" } });
      await prisma.auditLog.create({ data: { user_id: sub.user_id, action: "SUBSCRIPTION_EXPIRED" } });
      await this.aiTokenService.syncUserPlanTokens(sub.user_id, "FREE");
    }
  }
}
