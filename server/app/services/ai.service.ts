import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";
import { env } from "../../config/envManager.js";
import { FileService } from "./file.service.js";
import { AiTokenService } from "./ai-token.service.js";
import crypto from "crypto";

function formatDocument(doc: any) {
  const profile = doc.uploadedBy?.profile;
  const displayName =
    profile?.firstname && profile?.lastname
      ? `${profile.firstname} ${profile.lastname}`
      : doc.uploadedBy?.username ?? "Utilisateur";

  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    niveau: doc.niveau,
    filiere: doc.filiere,
    ue: doc.ue,
    type: doc.type,
    fileUrl: doc.fileUrl,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    downloadCount: doc.downloadCount,
    moderationStatus: doc.moderationStatus,
    folderId: doc.folder_id,
    uploadedById: doc.uploaded_by_id,
    createdAt: doc.createdAt,
    uploadedBy: doc.uploadedBy ? {
      id: doc.uploadedBy.id,
      username: doc.uploadedBy.username,
      displayName,
      avatarUrl: profile?.avatarUrl ?? null,
    } : null,
  };
}

/**
 * Service de gestion du chat IA.
 * Gère les sessions, les quotas de jetons par plan, et appelle le provider IA.
 */
export class AiService {
  private fileService = new FileService();
  private tokenService = new AiTokenService();

  async getTokensStatus(userId: string) {
    return await this.tokenService.getUserTokenStatus(userId);
  }

  async chat(userId: string, sessionId: string | null, message: string, _plan: string) {
    // Vérification du solde de jetons
    await this.tokenService.ensureSufficientTokens(userId, 20);

    let session = sessionId
      ? await prisma.aiSession.findFirst({ where: { id: sessionId, user_id: userId } })
      : null;

    if (!session) {
      session = await prisma.aiSession.create({
        data: {
          user_id: userId,
          title:   message.substring(0, 50),
        },
      });
    }

    const request = await prisma.aiMessage.create({
      data: { session_id: session.id, role: "user", content: message },
    });

    const sessionWithDocs = await prisma.aiSession.findUnique({
      where: { id: session.id },
      include: { documents: true }
    });

    const aiResponse = await this._callProvider(message, sessionWithDocs?.documents || []);

    const aiMessage = await prisma.aiMessage.create({
      data: { session_id: session.id, role: "assistant", content: aiResponse },
    });

    // Consommation et déduction des jetons
    const cost = this.tokenService.estimateTokenCost(message, aiResponse, false);
    const tokens = await this.tokenService.consumeTokens(userId, cost);

    return { session, message: aiMessage, request, tokens };
  }

  async getSessions(userId: string) {
    const sessions = await prisma.aiSession.findMany({
      where:   { user_id: userId },
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
    });
    return sessions;
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId },
      include: { messages: { orderBy: { createdAt: "asc" } }, documents: true }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    await prisma.aiSession.deleteMany({ where: { id: sessionId, user_id: userId } });
  }

  async getSessionDocuments(userId: string, sessionId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId },
      include: { documents: true }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };
    return session.documents;
  }

  async addDocumentToSession(userId: string, sessionId: string, documentId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };

    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    if (!doc) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    const updatedSession = await prisma.aiSession.update({
      where: { id: sessionId },
      data: {
        documents: {
          connect: { id: documentId }
        }
      },
      include: { documents: true }
    });
    return updatedSession.documents;
  }

  async removeDocumentFromSession(userId: string, sessionId: string, documentId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };

    await prisma.aiSession.update({
      where: { id: sessionId },
      data: {
        documents: {
          disconnect: { id: documentId }
        }
      }
    });
  }

  async generateStudyAid(userId: string, sessionId: string, type: string) {
    // Vérification du solde de jetons (base 120 jetons pour génération d'outils)
    await this.tokenService.ensureSufficientTokens(userId, 120);

    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId },
      include: { documents: true }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };

    if (session.documents.length === 0) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        status: 400,
        message: "Veuillez associer au moins un document à cette session pour générer du contenu.",
      };
    }

    let content = "";
    const ragApiUrl = env.get("RAG_AGENT_API_URL");

    if (ragApiUrl) {
      try {
        const response = await fetch(`${ragApiUrl}/api/v1/generate-study-aid`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_ids: session.documents.map((d) => d.id),
            type,
          }),
        });

        if (response.ok) {
          const data = await response.json() as { content: string };
          content = data.content;
        } else {
          throw new Error(`RAG API responded with status ${response.status}`);
        }
      } catch (err) {
        console.error('[RAG Agent generateStudyAid Error] Falling back:', err);
        content = `### Service en cours de conception\n\nDésolé, la génération automatique d'outils d'étude (${type}) est actuellement indisponible ou en cours de conception.`;
      }
    } else {
      content = `### Service en cours de conception\n\nDésolé, la génération automatique d'outils d'étude (${type}) est actuellement indisponible ou en cours de conception.`;
    }

    const aiMessage = await prisma.aiMessage.create({
      data: {
        session_id: session.id,
        role: "assistant",
        content,
      },
    });

    // Consommation des jetons
    const cost = this.tokenService.estimateTokenCost(type, content, true);
    const tokens = await this.tokenService.consumeTokens(userId, cost);

    return { message: aiMessage, tokens };
  }

  async uploadAttachment(userId: string, payload: Record<string, unknown>, file: Buffer, meta: { originalName: string; mimeType: string }) {
    // We do not require niveau, filiere, ue for personal AI attachments, but we accept them.
    const filiere = (payload.filiere as string) || "Général";
    const niveau = (payload.niveau as string) || "Général";
    const ue = (payload.ue as string) || "Général";

    // Deduplication check by hash
    const hash = crypto.createHash("sha256").update(file).digest("hex");
    const existingDoc = await prisma.document.findFirst({
      where: { hash, uploaded_by_id: userId, type: "AI_ATTACHMENT" },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            profile: { select: { firstname: true, lastname: true, avatarUrl: true } }
          }
        }
      }
    });

    let url: string;
    let size: number;
    let document: any;

    if (existingDoc) {
      document = existingDoc;
    } else {
      const stored = await this.fileService.storeAiAttachment(file, meta.mimeType, meta.originalName);
      url = stored.url;
      size = stored.size;

      document = await prisma.document.create({
        data: {
          uploaded_by_id: userId,
          title: (payload.title as string) || meta.originalName,
          description: (payload.description as string) || null,
          niveau,
          filiere,
          ue,
          type: "AI_ATTACHMENT",
          fileUrl: url,
          fileName: meta.originalName,
          fileSize: size,
          mimeType: meta.mimeType,
          isPublic: false,
          moderationStatus: "APPROVED",
          hash,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              profile: { select: { firstname: true, lastname: true, avatarUrl: true } }
            }
          }
        }
      });
    }

    // RAG Ingestion
    const ragApiUrl = env.get("RAG_AGENT_API_URL");
    if (ragApiUrl) {
      Promise.resolve().then(async () => {
        try {
          const formData = new FormData();
          const fileBlob = new Blob([new Uint8Array(file)], { type: meta.mimeType });
          formData.append("file", fileBlob, meta.originalName);
          formData.append("document_id", document.id);
          formData.append("filiere", filiere);
          formData.append("niveau", niveau);
          formData.append("ue", ue);
          formData.append("type", document.type);

          const res = await fetch(`${ragApiUrl}/api/v1/ingest`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) console.error(`[RAG Ingest AI Attachment] failed: ${res.statusText}`);
        } catch (err) {
          console.error(`[RAG Ingest AI Attachment] Error:`, err);
        }
      });
    }

    return formatDocument(document);
  }

  async getAttachments(userId: string) {
    const documents = await prisma.document.findMany({
      where: {
        uploaded_by_id: userId,
        type: "AI_ATTACHMENT"
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            profile: { select: { firstname: true, lastname: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return documents.map(formatDocument);
  }

  async deleteAttachment(userId: string, documentId: string) {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    if (document.uploaded_by_id !== userId || document.type !== "AI_ATTACHMENT") {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisée." };
    }

    // Delete from FileSystem/Drive
    await this.fileService.deleteFileByUrl(document.fileUrl);

    // Delete from DB
    await prisma.document.delete({ where: { id: documentId } });

    // Delete from RAG
    const ragApiUrl = env.get("RAG_AGENT_API_URL");
    if (ragApiUrl) {
      Promise.resolve().then(async () => {
        try {
          await fetch(`${ragApiUrl}/api/v1/documents/${documentId}`, { method: "DELETE" });
        } catch (err) {
          console.error(`[RAG Delete] Error connecting to RAG agent for document ${documentId}:`, err);
        }
      });
    }
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  private async _checkQuota(userId: string, plan: string) {
    if (plan === "PREMIUM") return;

    const startOfDay = DateTime.utc().startOf("day").toJSDate();
    const count = await prisma.aiMessage.count({
      where: {
        role:      "user",
        session:   { user_id: userId },
        createdAt: { gte: startOfDay },
      },
    });

    if (count >= 20) {
      throw { code: ErrorCode.QUOTA_EXCEEDED, status: 402, message: "Limite de 20 messages IA par jour atteinte. Passez en PREMIUM." };
    }
  }

  private async _callProvider(message: string, documents: any[]): Promise<string> {
    if (!documents || documents.length === 0) {
      return "Hiro : Je n'ai aucune source documentaire associée à cette conversation. Veuillez associer un document de votre bibliothèque pour que je puisse y faire référence.";
    }

    const ragApiUrl = env.get("RAG_AGENT_API_URL");

    if (ragApiUrl) {
      try {
        const response = await fetch(`${ragApiUrl}/api/v1/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: message,
            document_ids: documents.map((d) => d.id),
            conversation_history: [],
          }),
        });

        if (response.ok) {
          const data = await response.json() as { answer: string };
          return data.answer;
        } else {
          throw new Error(`RAG API responded with status ${response.status}`);
        }
      } catch (err) {
        console.error('[RAG Agent Error] Falling back:', err);
        return "Désolé, le service de recherche intelligente et de RAG est actuellement en cours de conception ou indisponible.";
      }
    }

    return "Désolé, le service de recherche intelligente et de RAG est actuellement en cours de conception ou indisponible.";
  }
}
