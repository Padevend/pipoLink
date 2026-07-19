import { prisma } from "../../config/database.js";
import { DateTime } from "luxon";
import { env } from "../../config/envManager.js";
import { MailerService } from "./mailer.service.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";
import {PaymentOperation,RandomGenerator} from "@hachther/mesomb";

// Prix de l'abonnement Premium, fixé côté serveur (le montant client est ignoré)
const PREMIUM_PRICE_XAF = 2500;

export class PaymentService {
  /**
   * Initiates a mobile money payment collection via MeSomb.
   * Le montant client (_amount) est ignoré : le prix est fixé côté serveur.
   */
  async initiatePayment(userId: string, _amount: number | undefined, provider: string, phone: string) {
    let sub = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          user_id: userId,
          plan: "FREE",
          status: "ACTIVE",
        },
      });
    }

    // Concurrency Lock: Check if there's a PENDING payment created in the last 5 minutes
    const recentPendingPayment = await prisma.payment.findFirst({
      where: {
        user_id: userId,
        status: "PENDING",
        createdAt: {
          gte: DateTime.now().minus({ minutes: 5 }).toJSDate(),
        },
      },
    });

    if (recentPendingPayment) {
      throw {
        code: "PAYMENT_IN_PROGRESS",
        status: 409,
        message: "Une transaction est déjà en cours. Veuillez confirmer le paiement sur votre téléphone.",
      };
    }

    // Create the payment record as PENDING first
    const payment = await prisma.payment.create({
      data: {
        user_id: userId,
        subscription_id: sub.id,
        amount: PREMIUM_PRICE_XAF,
        provider,
        expiresAt: DateTime.now().plus({ hours: 1 }).toJSDate(),
      },

    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: "PAYMENT_INITIATED",
        targetId: payment.id,
      },
    });


    try {
      const applicationKey = env.get("MESOMB_APP_KEY");
      const accessKey = env.get("MESOMB_ACCESS_KEY");
      const secretKey = env.get("MESOMB_SECRET_KEY");

      if (!applicationKey || !accessKey || !secretKey) {
        throw new Error("Clés d'API MeSomb non configurées sur le serveur.");
      }

      // Initialize MeSomb payment operation client
      const mesomb = new PaymentOperation({
        applicationKey,
        accessKey,
        secretKey,
      });

      const nonce = RandomGenerator ? RandomGenerator.nonce() : Math.random().toString(36).substring(2, 15);

      // Perform collect transaction
      const response = await mesomb.makeCollect({
        payer: phone,
        amount: PREMIUM_PRICE_XAF,
        service: provider, // 'MTN' or 'ORANGE'
        currency: 'XAF',
        country: 'CM',
        nonce,
      });

      const transactionPk = response.transaction?.pk || null;
      // isTransactionSuccess = paiement réellement confirmé (status SUCCESS).
      // isOperationSuccess ne signifie que « requête API acceptée » : un paiement
      // rejeté par l'utilisateur renvoie success=true + transaction.status=FAILED.
      const isSuccess = typeof (response as any).isTransactionSuccess === "function"
        ? (response as any).isTransactionSuccess()
        : response.transaction?.status === "SUCCESS";

      // Save the provider reference and update state
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: response.transaction.status,
          providerRef: transactionPk,
        },
      });

      if (isSuccess) {
        return await this.completePayment(payment.id);
      }

      return updatedPayment;
    } catch (err: any) {
      console.error("[MeSomb Collect Error]:", err);
      // Mark payment as FAILED if collection setup failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      }).catch(() => {});

      throw {
        code: "PAYMENT_FAILED",
        status: 400,
        message: err.message || "La transaction n'a pas pu être initiée auprès de MeSomb.",
      };
    }
  }

  /**
   * Completes a payment, activates the premium subscription plan, sends an invoice email, and broadcasts a WS event.
   */
  async completePayment(paymentId: string) {
    const trxResult = await prisma.$transaction(async (trx) => {
      const payment = await trx.payment.findUnique({ where: { id: paymentId } });
      // Un paiement FAILED ne doit JAMAIS être complété (protège aussi le webhook)
      if (!payment || payment.status === "SUCCESS" || payment.status === "FAILED") return { payment };

      // Update payment status to SUCCESS
      const updatedPayment = await trx.payment.update({
        where: { id: paymentId },
        data: { status: "SUCCESS", paidAt: new Date() },
      });

      const oldSub = await trx.subscription.findUnique({ where: { id: payment.subscription_id } });
      let newPeriodEnd = DateTime.now().plus({ months: 1 }).toJSDate();
      
      if (oldSub && oldSub.status === "ACTIVE" && oldSub.plan === "PREMIUM" && oldSub.currentPeriodEnd) {
        const currentEnd = DateTime.fromJSDate(oldSub.currentPeriodEnd);
        if (currentEnd > DateTime.now()) {
          newPeriodEnd = currentEnd.plus({ months: 1 }).toJSDate();
        }
      }

      // Update subscription plan to PREMIUM
      const subscription = await trx.subscription.update({
        where: { id: payment.subscription_id },
        data: {
          plan: "PREMIUM",
          status: "ACTIVE",
          currentPeriodEnd: newPeriodEnd,
        },
      });

      // Fetch user details for invoicing
      const user = await trx.user.findUnique({ where: { id: payment.user_id } });

      // Create Audit Logs
      await trx.auditLog.create({
        data: {
          user_id: payment.user_id,
          action: "PAYMENT_COMPLETED",
          targetId: payment.id,
        },
      });

      await trx.auditLog.create({
        data: {
          user_id: payment.user_id,
          action: "SUBSCRIPTION_ACTIVATED",
          targetId: subscription.id,
        },
      });

      return { payment: updatedPayment, subscription, user };
    });

    if (!trxResult.payment || !trxResult.subscription) return trxResult.payment;

    const { payment, subscription, user } = trxResult;

    // Send invoice email asynchronously
    if (user?.email) {
      const mailer = new MailerService();
      const formattedDate = DateTime.now().setLocale("fr").toLocaleString(DateTime.DATE_FULL);
      mailer.sendInvoice(
        user.email,
        user.username || "Utilisateur",
        payment.id,
        payment.amount.toString(),
        formattedDate,
        "Premium (1 Mois)",
        payment.provider
      ).catch((mailErr) => {
        console.error("[MailerService] failed to send subscription invoice:", mailErr);
      });
    }

    // Broadcast subscription change via RealtimeBus
    try {
      RealtimeBus.emit(WsEventName.SubscriptionUpdated, subscription, { userId: payment.user_id });
    } catch (wsErr) {
      console.error("[RealtimeBus] subscription sync emission failed:", wsErr);
    }

    return payment;
  }

  /**
   * Gets the status of a payment.
   * Si le paiement est PENDING, interroge activement MeSomb (checkTransactions)
   * pour confirmer ou invalider la transaction — l'abonnement ne s'active
   * que sur un SUCCESS confirmé par MeSomb.
   */
  async getStatus(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== "PENDING" || !payment.providerRef) {
      return payment;
    }

    const applicationKey = env.get("MESOMB_APP_KEY");
    const accessKey = env.get("MESOMB_ACCESS_KEY");
    const secretKey = env.get("MESOMB_SECRET_KEY");
    if (!applicationKey || !accessKey || !secretKey) return payment;

    try {
      const mesomb = new PaymentOperation({ applicationKey, accessKey, secretKey });
      const transactions = (await mesomb.checkTransactions([payment.providerRef])) as any[];
      const tx = transactions?.find((t) => t?.pk === payment.providerRef) ?? transactions?.[0];

      if (tx?.status === "SUCCESS") {
        return await this.completePayment(payment.id);
      }
      if (tx?.status === "FAILED") {
        return await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
      }
    } catch (err) {
      console.error("[MeSomb checkTransactions Error]:", err);
    }

    return payment;
  }
}
