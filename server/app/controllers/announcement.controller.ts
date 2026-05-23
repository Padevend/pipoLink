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
    
    const body = await c.req.parseBody();
    const file = body["file"];
    const payloadRaw = body["payload"] ? JSON.parse(body["payload"] as string) : {};

    const payload = await announcementValidator.validate(payloadRaw);
    const announcement = await this.service.createAnnouncement(authorId, {
      ...payload,
      poster: file as File | null | undefined,
    });

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

  async delete(c: HttpContext) {
    const announcementId = c.req.param("id");
    const role = c.get("role") as string;

    if( !announcementId ) {
      return ApiResponse.error(c, "BAD_REQUEST", "ID de l'annonce requis.", 400);
    }

    if (role !== "admin" && role !== "staff") {
      return ApiResponse.error(c, "FORBIDDEN", "Réservé au personnel.", 403);
    }

    // Vérifier que l'annonce existe avant de tenter de la supprimer
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return ApiResponse.error(c, "NOT_FOUND", "Annonce non trouvée.", 404);
    }

    if(announcement.author_id !== c.get("userId") || role !== "admin") {
      return ApiResponse.error(c, "FORBIDDEN", "Réservé au personnel.", 403);
    }

    await this.service.deleteAnnouncement(announcementId);

    RealtimeBus.emit(WsEventName.AnnouncementDeleted, { id: announcementId }, {});

    return ApiResponse.success(c, null, "Annonce supprimée.");
  }
}
