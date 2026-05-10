import { prisma } from "../../config/database.js";
import { DateTime } from "luxon";
import { ErrorCode } from "../helpers/error-codes.js";

export class PaymentService {
  async initiatePayment(userId: string, amount: number, provider: string) {
    const sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!sub) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Abonnement introuvable." };

    return await prisma.payment.create({
      data: {
        user_id: userId,
        subscription_id: sub.id,
        amount,
        provider,
        expiresAt: DateTime.now().plus({ hours: 1 }).toJSDate(),
      }
    });
  }

  async confirmSimulated(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Paiement introuvable." };

    await prisma.payment.update({ where: { id: paymentId }, data: { status: "SUCCESS", paidAt: new Date() } });

    const subscription = await prisma.subscription.update({
      where: { id: payment.subscription_id },
      data: {
        plan: "PREMIUM",
        status: "ACTIVE",
        currentPeriodEnd: DateTime.now().plus({ months: 1 }).toJSDate()
      }
    });

    await prisma.auditLog.create({ data: { user_id: payment.user_id, action: "SUBSCRIPTION_ACTIVATED" } });

    return { payment, subscription };
  }

  async getStatus(paymentId: string) {
    return await prisma.payment.findUnique({ where: { id: paymentId } });
  }
}
