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
    const session = await this.service.getSession(userId, sessionId as string);
    return ApiResponse.success(c, session, "Session récupérée.");
  }

  async deleteSession(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sessionId = c.req.param("id");
    if (!sessionId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID de session requis.", 400);
    }
    await this.service.deleteSession(userId, sessionId);
    return ApiResponse.success(c, null, "Session supprimée.");
  }

  async getDocuments(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sessionId = c.req.param("id");
    if (!sessionId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID de session requis.", 400);
    }
    const docs = await this.service.getSessionDocuments(userId, sessionId);
    return ApiResponse.success(c, docs, "Documents de la session récupérés.");
  }

  async addDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sessionId = c.req.param("id");
    if (!sessionId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID de session requis.", 400);
    }
    const { documentId } = await c.req.json() as { documentId: string };
    if (!documentId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID du document requis.", 400);
    }
    const result = await this.service.addDocumentToSession(userId, sessionId, documentId);
    return ApiResponse.success(c, result, "Document ajouté à la session.");
  }

  async removeDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    const sessionId = c.req.param("id");
    if (!sessionId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID de session requis.", 400);
    }
    const documentId = c.req.param("documentId");
    if (!documentId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID du document requis.", 400);
    }
    await this.service.removeDocumentFromSession(userId, sessionId, documentId);
    return ApiResponse.success(c, null, "Document retiré de la session.");
  }

  async generateStudyAid(c: HttpContext) {
    const userId = c.get("userId") as string;

    const sessionId = c.req.param("id");
    if (!sessionId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID de session requis.", 400);
    }
    const { type } = await c.req.json() as { type: string };
    if (!type) {
      return ApiResponse.error(c, "TYPE_REQUIRED", "Type de génération requis.", 400);
    }
    const result = await this.service.generateStudyAid(userId, sessionId, type);
    return ApiResponse.success(c, result, "Génération effectuée.");
  }

  async uploadAttachment(c: HttpContext) {
    const userId = c.get("userId") as string;
    const body = await c.req.parseBody();
    const file = body["file"];
    const payloadRaw = body["payload"] ? JSON.parse(body["payload"] as string) : {};
    
    if (!(file instanceof File)) {
      return ApiResponse.error(c, "FILE_REQUIRED", "Fichier requis.", 400);
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = { originalName: file.name, mimeType: file.type };
    
    const document = await this.service.uploadAttachment(userId, payloadRaw, buffer, meta);
    return ApiResponse.success(c, document, "Pièce jointe IA uploadée.", 201);
  }

  async deleteAttachment(c: HttpContext) {
    const userId = c.get("userId") as string;
    const documentId = c.req.param("id");
    if (!documentId) {
      return ApiResponse.error(c, "ID_REQUIRED", "ID du document requis.", 400);
    }
    await this.service.deleteAttachment(userId, documentId);
    return ApiResponse.success(c, null, "Pièce jointe IA supprimée.");
  }

  async getAttachments(c: HttpContext) {
    const userId = c.get("userId") as string;
    const docs = await this.service.getAttachments(userId);
    return ApiResponse.success(c, docs, "Pièces jointes IA récupérées.");
  }
}
