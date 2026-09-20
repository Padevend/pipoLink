import { HttpContext } from "../../config/app.js";
import { SubscriptionService } from "../services/subscription.service.js";
import { ApiResponse } from "../helpers/api-response.js";

export class SubscriptionController {
  private service = new SubscriptionService();

  async setAutoRenew(c: HttpContext) {
    const userId = c.get("userId") as string;
    const body = await c.req.json().catch(() => ({}));
    if (typeof body.autoRenew !== "boolean") return ApiResponse.error(c, "VALIDATION_ERROR", "autoRenew doit être un booléen.", 400);
    const sub = await this.service.setAutoRenew(userId, body.autoRenew);
    return ApiResponse.success(c, sub, "Préférence de renouvellement mise à jour.");
  }

  async get(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sub = await this.service.getSubscription(userId);
    return ApiResponse.success(c, sub, "Abonnement récupéré.");
  }
}
