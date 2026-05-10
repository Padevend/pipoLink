import { HttpContext } from "../../config/app.js";
import { SubscriptionService } from "../services/subscription.service.js";
import { ApiResponse } from "../helpers/api-response.js";

export class SubscriptionController {
  private service = new SubscriptionService();

  async get(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sub = await this.service.getSubscription(userId);
    return ApiResponse.success(c, sub, "Abonnement récupéré.");
  }
}
