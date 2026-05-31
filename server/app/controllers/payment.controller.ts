import { HttpContext } from "../../config/app.js";
import { PaymentService } from "../services/payment.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { paymentInitiateValidator } from "../validators/payment.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

export class PaymentController {
  private service = new PaymentService();

  async initiate(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(paymentInitiateValidator);
    const payment = await this.service.initiatePayment(userId, payload.amount, payload.provider);
    return ApiResponse.success(c, payment, "Paiement initié.", 201);
  }

  async confirmSimulated(c: HttpContext) {
    const paymentId = c.req.param("id");

    if(!paymentId) {
      return ApiResponse.error(c, "ID_REQUIRED", "L'ID du paiement est requis.", 400);
    }

    const result = await this.service.confirmSimulated(paymentId);
    RealtimeBus.emit(WsEventName.SubscriptionUpdated, result.subscription, { userId: result.payment.user_id });
    return ApiResponse.success(c, null, "Paiement simulé avec succès.");
  }

  async getStatus(c: HttpContext) {
    const paymentId = c.req.param("id");

    if(!paymentId) {
      return ApiResponse.error(c, "ID_REQUIRED", "L'ID du paiement est requis.", 400);
    }
    
    const payment = await this.service.getStatus(paymentId);
    return ApiResponse.success(c, payment, "Statut du paiement récupéré.");
  }
}
