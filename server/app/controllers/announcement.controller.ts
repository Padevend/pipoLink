import { HttpContext } from "../../config/app.js";
import { AnnouncementService } from "../services/announcement.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { announcementValidator } from "../validators/announcement.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

export class AnnouncementController {
  private service = new AnnouncementService();

  async list(c: HttpContext) {
    const announcements = await this.service.listAnnouncements();
    return ApiResponse.success(c, announcements, "Annonces récupérées.");
  }

  async create(c: HttpContext) {
    const authorId = c.get("userId") as string;
    const payload = await c.validateUsing(announcementValidator);
    const announcement = await this.service.createAnnouncement(authorId, payload);
    RealtimeBus.emit(WsEventName.AnnouncementCreated, announcement, {});
    return ApiResponse.success(c, announcement, "Annonce créée.", 201);
  }
}
