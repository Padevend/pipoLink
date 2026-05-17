import { HttpContext } from "../../config/app.js";
import { AnnouncementService } from "../services/announcement.service.js";
import { NotificationService } from "../services/notification.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { announcementValidator } from "../validators/announcement.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";
import { prisma } from "../../config/database.js";

export class AnnouncementController {
  private service = new AnnouncementService();
  private notifications = new NotificationService();

  async list(c: HttpContext) {
    const announcements = await this.service.listAnnouncements();
    return ApiResponse.success(c, announcements, "Annonces récupérées.");
  }

  async create(c: HttpContext) {
    const authorId = c.get("userId") as string;
    const role = c.get("role") as string;

    if (role !== "admin" && role !== "staff") {
      return ApiResponse.error(c, "FORBIDDEN", "Réservé au personnel.", 403);
    }

    const payload = await c.validateUsing(announcementValidator);
    const announcement = await this.service.createAnnouncement(authorId, payload);

    RealtimeBus.emit(WsEventName.AnnouncementCreated, announcement, {});

    const recipients = await prisma.user.findMany({
      where:  { is_active: true, id: { not: authorId } },
      select: { id: true },
    });

    await Promise.all(
      recipients.map(async (u) => {
        await this.notifications.createNotification(u.id, {
          title: "Nouvelle annonce",
          body:  announcement.title,
          type:  "ANNOUNCEMENT",
          data:  { announcementId: announcement.id },
        });
        RealtimeBus.emit(
          WsEventName.NotificationCreated,
          { announcementId: announcement.id },
          { userId: u.id },
        );
      }),
    );

    return ApiResponse.success(c, announcement, "Annonce créée.", 201);
  }
}
