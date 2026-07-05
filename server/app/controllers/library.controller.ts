import { HttpContext } from "../../config/app.js";
import { LibraryService } from "../services/library.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { uploadDocumentValidator, moderateDocumentValidator } from "../validators/library.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";
import { prisma } from "../../config/database.js";

export class LibraryController {
  private service = new LibraryService();

  async browse(c: HttpContext) {
    const role = c.get("role") as string;
    const parentId = c.req.query("parentId") ?? null;
    const result = await this.service.browse(role, parentId || null);
    return ApiResponse.success(c, result, "Contenu du dossier.");
  }

  async listMyDocuments(c: HttpContext) {
    const userId = c.get("userId") as string;
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "30", 10);
    const result = await this.service.listMyDocuments(userId, page, limit);
    return ApiResponse.paginated(c, result.documents, result.total, page, limit);
  }

  async getDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const documentId = c.req.param("id") || "";
    const doc = await this.service.getDocument(documentId, role, userId);
    return ApiResponse.success(c, doc, "Document récupéré.");
  }

  async listDocuments(c: HttpContext) {
    const role = c.get("role") as string;
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "20", 10);

    const filters = {
      filiere: c.req.query("filiere"),
      niveau:  c.req.query("niveau"),
      ue:      c.req.query("ue"),
      type:    c.req.query("type"),
      year:    c.req.query("year"),
      search:  c.req.query("search"),
    };

    const result = await this.service.listDocuments(role, filters, page, limit);
    return ApiResponse.paginated(c, result.documents, result.total, page, limit);
  }

  async uploadDocument(c: HttpContext) {
    const userId = c.get("userId") as string;
    const plan = c.get("plan") as string || "FREE";
    const body = await c.req.parseBody();
    const file = body["file"];
    const payloadRaw = body["payload"] ? JSON.parse(body["payload"] as string) : {};

    await uploadDocumentValidator.validate(payloadRaw);

    if (file instanceof File) {
      if (plan === "FREE") {
        // Enforce 5MB limit for free users
        if (file.size > 5 * 1024 * 1024) {
          return ApiResponse.error(
            c,
            "LIMIT_EXCEEDED",
            "Les comptes GRATUITS sont limités à 5 Mo par fichier. Passez en PREMIUM pour uploader jusqu'à 50 Mo.",
            402
          );
        }

        // Enforce 5 documents limit for free users
        const count = await prisma.document.count({
          where: { uploaded_by_id: userId },
        });
        if (count >= 5) {
          return ApiResponse.error(
            c,
            "LIMIT_EXCEEDED",
            "Les comptes GRATUITS sont limités à 5 documents dans leur bibliothèque. Veuillez en supprimer ou passer en PREMIUM.",
            402
          );
        }
      }

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

  async getPopularDocuments(c: HttpContext) {
    const niveau = c.req.query("level")
    const docs = await this.service.getPopular(niveau);
    return ApiResponse.success(c, docs, "Documents populaires.");
  }

  async getRecommandedDocuments(c: HttpContext) {
    const userId = c.get("userId") as string;
    const docs = await this.service.getRecommanded(userId);
    return ApiResponse.success(c, docs, "Documents recommandés.");
  }
}
