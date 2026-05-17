import { HttpContext } from "../../config/app.js";
import { LibraryService } from "../services/library.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { uploadDocumentValidator, moderateDocumentValidator, updateDocumentValidator } from "../validators/library.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

export class LibraryController {
  private service = new LibraryService();

  async listDocuments(c: HttpContext) {
    const role = c.get("role") as string;
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "20", 10);

    const filters = {
      filiere: c.req.query("filiere"),
      niveau:  c.req.query("niveau"),
      ue:      c.req.query("ue"),
      type:    c.req.query("type"),
      year:    c.req.query("year")
    };

    const result = await this.service.listDocuments(role, filters, page, limit);
    return ApiResponse.paginated(c, result.documents, result.total, page, limit);
  }

  async uploadDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    console.log("Upload document payload:");

    const body = await c.req.parseBody();
    const file = body["file"];
    const payloadRaw = body["payload"] ? JSON.parse(body["payload"] as string) : {};

    await uploadDocumentValidator.validate(payloadRaw);

    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const meta = { originalName: file.name, mimeType: file.type };
      const doc = await this.service.uploadDocument(userId, payloadRaw, buffer, meta);
      RealtimeBus.emit(WsEventName.DocumentUploaded, doc, { userId });
      return ApiResponse.success(c, doc, "Document uploadé.", 201);
    }

    return ApiResponse.error(c, "VALIDATION_ERROR", "Fichier invalide.", 400);
  }

  async searchDocuments(c: HttpContext) {
    const query = c.req.query("q") || "";
    const role = c.get("role") as string;
    const docs = await this.service.searchDocuments(query, role);
    return ApiResponse.success(c, docs, "Documents trouvés.");
  }

  async downloadDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    const documentId = c.req.param("id") || "";
    const result = await this.service.downloadDocument(documentId, userId);
    return ApiResponse.success(c, result, "Lien de téléchargement généré.");
  }

  async updateDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const documentId = c.req.param("id") || "";
    const payload = await c.validateUsing(updateDocumentValidator);

    const doc = await this.service.updateDocument(userId, role, documentId, payload);
    RealtimeBus.emit(WsEventName.DocumentUpdated, doc, { userId });
    return ApiResponse.success(c, doc, "Document mis a jour.");
  }

  async deleteDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const documentId = c.req.param("id") || "";
    await this.service.deleteDocument(userId, role, documentId);
    RealtimeBus.emit(WsEventName.DocumentUpdated, { id: documentId, deleted: true }, { userId });
    return ApiResponse.success(c, null, "Document supprime.");
  }

  async moderateDocument(c: HttpContext) {
    const documentId = c.req.param("id") || "";
    const payload = await c.validateUsing(moderateDocumentValidator);
    const doc = await this.service.moderateDocument(documentId, payload.decision, payload.rejectionReason);
    RealtimeBus.emit(WsEventName.DocumentUpdated, doc, { userId: c.get("userId") as string });
    return ApiResponse.success(c, doc, "Document modéré.");
  }
}
