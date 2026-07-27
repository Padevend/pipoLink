import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";
import { FileService } from "./file.service.js";
import { AiTokenService } from "./ai-token.service.js";
import { TokenPricingService } from "./token-pricing.service.js";
import { RagService, type RagTokensUsed } from "./rag.service.js";
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
  private rag = new RagService();
  private pricingService = new TokenPricingService();

  async getTokensStatus(userId: string) {
    return await this.tokenService.getUserTokenStatus(userId);
  }

  async chat(userId: string, sessionId: string | null, message: string, _plan: string) {
    // Tarif fixe pour une question / chat IA
    const cost = this.pricingService.getOperationCost("QUESTION_IA");
    await this.tokenService.ensureSufficientTokens(userId, cost);

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

    const previousMessages = await prisma.aiMessage.findMany({
      where: { session_id: session.id, id: { not: request.id } },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    const conversationHistory = previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const sessionWithDocs = await prisma.aiSession.findUnique({
      where: { id: session.id },
      include: { documents: true }
    });

    const { answer } = await this._callProvider(
      message,
      sessionWithDocs?.documents || [],
      conversationHistory
    );

    const aiMessage = await prisma.aiMessage.create({
      data: { session_id: session.id, role: "assistant", content: answer },
    });

    // Déduction du coût fixe en Jetons
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

  async createSession(userId: string, title: string, documentIds?: string[]) {
    const session = await prisma.aiSession.create({
      data: {
        user_id: userId,
        title: title || "Notebook sans titre",
      },
    });

    if (documentIds && documentIds.length > 0) {
      await prisma.aiSession.update({
        where: { id: session.id },
        data: {
          documents: {
            connect: documentIds.map((id) => ({ id })),
          },
        },
      });
    }

    const sessionWithDocs = await prisma.aiSession.findUnique({
      where: { id: session.id },
      include: { documents: true },
    });

    return { session: sessionWithDocs };
  }

  async truncateMessagesFrom(userId: string, sessionId: string, messageId: string, inclusive = true) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };

    const targetMsg = await prisma.aiMessage.findUnique({
      where: { id: messageId }
    });
    if (!targetMsg) return;

    if (inclusive) {
      await prisma.aiMessage.deleteMany({
        where: {
          session_id: sessionId,
          createdAt: { gte: targetMsg.createdAt }
        }
      });
    } else {
      await prisma.aiMessage.deleteMany({
        where: {
          session_id: sessionId,
          createdAt: { gt: targetMsg.createdAt }
        }
      });
    }
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
    // Calcul du tarif fixe en Jetons PipoLink pour ce type d'outil (ex: Summary: 15, Quiz: 25...)
    const cost = this.pricingService.getOperationCost(type);
    await this.tokenService.ensureSufficientTokens(userId, cost);

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
    const FALLBACK = `### Service en cours de conception\n\nDésolé, la génération automatique d'outils d'étude (${type}) est actuellement indisponible ou en cours de conception.`;

    if (this.rag.isAvailable()) {
      try {
        const data = await this.rag.generateStudyAid({
          document_ids: session.documents.map((d) => d.id),
          type,
        });
        content = data.content;
      } catch (err) {
        console.error('[RAG Agent generateStudyAid Error] Falling back:', err);
        content = FALLBACK;
      }
    } else {
      content = FALLBACK;
    }

    const aiMessage = await prisma.aiMessage.create({
      data: {
        session_id: session.id,
        role: "assistant",
        content,
      },
    });

    // Déduction du coût fixe en Jetons PipoLink
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

    // RAG Ingestion (non-bloquante)
    if (this.rag.isAvailable()) {
      Promise.resolve().then(async () => {
        try {
          await this.rag.ingest({
            file,
            originalName: meta.originalName,
            mimeType: meta.mimeType,
            documentId: document.id,
            filiere,
            niveau,
            ue,
            type: document.type,
            ownerId: userId,
          });
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

    // Delete from RAG (non-bloquante)
    if (this.rag.isAvailable()) {
      Promise.resolve().then(async () => {
        try {
          await this.rag.deleteDocument(documentId);
        } catch (err) {
          console.error(`[RAG Delete] Error connecting to RAG agent for document ${documentId}:`, err);
        }
      });
    }
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  private async _callProvider(
    message: string,
    documents: any[],
    conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }> = [],
    maxTokens?: number
  ): Promise<{ answer: string; tokensUsed?: RagTokensUsed }> {
    if (!documents || documents.length === 0) {
      return {
        answer: "Hiro : Je n'ai aucune source documentaire associée à cette conversation. Veuillez associer un document de votre bibliothèque pour que je puisse y faire référence.",
      };
    }

    const FALLBACK = "Désolé, le service de recherche intelligente et de RAG est actuellement en cours de conception ou indisponible.";

    if (!this.rag.isAvailable()) return { answer: FALLBACK };

    try {
      const data = await this.rag.query({
        query: message,
        document_ids: documents.map((d) => d.id),
        conversation_history: conversationHistory,
        max_tokens: maxTokens,
      });
      return { answer: data.answer, tokensUsed: data.tokens_used };
    } catch (err) {
      console.error('[RAG Agent Error] Falling back:', err);
      return { answer: FALLBACK };
    }
  }
}
