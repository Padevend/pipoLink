import { prisma } from "../../config/database.js";
import { AiTokenService } from "./ai-token.service.js";

export class SubscriptionService {
  private aiTokenService = new AiTokenService();

  async getSubscription(userId: string) {
    let sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!sub) {
      sub = await prisma.subscription.create({ data: { user_id: userId, plan: "FREE", status: "ACTIVE" } });
    }
    return sub;
  }

  async checkExpirations() {
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
