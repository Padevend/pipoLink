import { HttpContext } from "../../config/app.js";
import { PaymentService } from "../services/payment.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { paymentInitiateValidator } from "../validators/payment.validator.js";
import { env } from "../../config/envManager.js";
import { prisma } from "../../config/database.js";
import crypto from "crypto";

export class PaymentController {
  private service = new PaymentService();

  async initiate(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(paymentInitiateValidator);
    const payment = await this.service.initiatePayment(userId, payload.amount, payload.provider, payload.phone);
    return ApiResponse.success(c, payment, "Paiement initié.", 201);
  }



  async getStatus(c: HttpContext) {
    const paymentId = c.req.param("id");

    if(!paymentId) {
      return ApiResponse.error(c, "ID_REQUIRED", "L'ID du paiement est requis.", 400);
    }
    
    const payment = await this.service.getStatus(paymentId);
    return ApiResponse.success(c, payment, "Statut du paiement récupéré.");
  }

  async handleWebhook(c: HttpContext) {
    const rawBody = await c.req.text();
    const signature = c.req.header("X-MeSomb-Webhook-Signature");
    const secretKey = env.get("MESOMB_SECRET_KEY");

    if (!signature || !secretKey) {
      return ApiResponse.error(c, "UNAUTHORIZED", "Signature manquante ou clé secrète non configurée.", 401);
    }

    // Compute expected signature
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawBody)
      .digest("hex");

    // Prevent timing attacks
    const isSignatureValid = signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isSignatureValid) {
      return ApiResponse.error(c, "INVALID_SIGNATURE", "La signature du webhook est invalide.", 401);
    }

    try {
      const payload = JSON.parse(rawBody);

      // MeSomb webhook event_type matches 'payment.succeeded' or similar for successful collections
      if (payload.event_type === "payment.succeeded" && payload.data?.object) {
        const transaction = payload.data.object;
        const transactionPk = transaction.pk;

        const payment = await prisma.payment.findFirst({
          where: { providerRef: transactionPk },
        });

        if (payment && payment.status !== "SUCCESS") {
          await prisma.auditLog.create({
            data: {
              user_id: payment.user_id,
              action: "PAYMENT_WEBHOOK_RECEIVED",
              targetId: payment.id,
            },
          });
          await this.service.completePayment(payment.id);
        } else if (!payment) {
          console.warn(`[PaymentWebhook] Aucun paiement trouvé pour providerRef: ${transactionPk}`);
        }
      }
    } catch (err) {
      console.error("[PaymentWebhook Error]:", err);
      return ApiResponse.error(c, "WEBHOOK_ERROR", "Erreur lors du traitement du webhook.", 400);
    }

    return c.json({ success: true }, 200);
  }
}
