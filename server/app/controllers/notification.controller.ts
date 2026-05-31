import { HttpContext } from "../../config/app.js";
import { NotificationService } from "../services/notification.service.js";
import { ApiResponse } from "../helpers/api-response.js";

export class NotificationController {
  private service = new NotificationService();

  async list(c: HttpContext) {
    const userId = c.get("userId") as string;
    const notifications = await this.service.listNotifications(userId);
    return ApiResponse.success(c, notifications, "Notifications récupérées.");
  }

  async markAsRead(c: HttpContext) {
    const userId = c.get("userId") as string;
    const notificationId = c.req.param("id");
    
    if(!notificationId) {
      return ApiResponse.error(c, "ID_REQUIRED", "L'ID de la notification est requis.", 400);
    }

    await this.service.markAsRead(userId, notificationId);
    return ApiResponse.success(c, null, "Notification lue.");
  }

  async markAllAsRead(c: HttpContext) {
    const userId = c.get("userId") as string;
    await this.service.markAllAsRead(userId);
    return ApiResponse.success(c, null, "Toutes les notifications lues.");
  }
}
