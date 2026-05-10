import { HttpContext } from "../../config/app.js";
import { AiService } from "../services/ai.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { chatValidator } from "../validators/ai.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

export class AiController {
  private service = new AiService();

  async chat(c: HttpContext) {
    const userId = c.get("userId") as string;
    const plan = c.get("plan") as string || "FREE";
    const payload = await c.validateUsing(chatValidator);
    
    const result = await this.service.chat(userId, payload.sessionId ?? null, payload.message, plan);
    RealtimeBus.emit(WsEventName.AiResponseCreated, result, { userId });
    return ApiResponse.success(c, result, "Message envoyé.", 201);
  }

  async getSessions(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sessions = await this.service.getSessions(userId);
    return ApiResponse.success(c, sessions, "Sessions récupérées.");
  }

  async getSession(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sessionId = c.req.param("id");
    const session = await this.service.getSession(userId, sessionId);
    return ApiResponse.success(c, session, "Session récupérée.");
  }

  async clearHistory(c: HttpContext) {
    const userId = c.get("userId") as string;
    await this.service.clearHistory(userId);
    return ApiResponse.success(c, null, "Historique supprimé.");
  }
}
