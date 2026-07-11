import { prisma } from "../../config/database.js";
export class SubscriptionService {


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
    }
  }
}
