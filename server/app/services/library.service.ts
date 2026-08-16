import crypto from "crypto";
import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { FileService } from "./file.service.js";
import { FolderResolverService } from "./folder-resolver.service.js";
import { RagService } from "./rag.service.js";
import { documentIngestionQueue } from "./document-ingestion-queue.service.js";

const docInclude = {
  uploadedBy: {
    select: {
      id: true,
      username: true,
      profile: { select: { firstname: true, lastname: true, avatarUrl: true } },
    },
  },
  tags: true,
} as const;

function formatDocument(doc: {
  id: string;
  title: string;
  description: string | null;
  niveau: string | null;
  filiere: string | null;
  ue: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  moderationStatus: string;
  isIngested: boolean;
  ingestionStatus: string;
  ingestionError: string | null;
  folder_id: string | null;
  uploaded_by_id: string;
  createdAt: Date;
  uploadedBy: {
    id: string;
    username: string | null;
    profile: { firstname: string; lastname: string; avatarUrl: string | null } | null;
  };
}) {
  const profile = doc.uploadedBy.profile;
  const displayName =
    profile?.firstname && profile?.lastname
      ? `${profile.firstname} ${profile.lastname}`
      : doc.uploadedBy.username ?? "Utilisateur";

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
    isIngested: doc.isIngested,
    ingestionStatus: doc.ingestionStatus,
    ingestionError: doc.ingestionError,
    folderId: doc.folder_id,
    uploadedById: doc.uploaded_by_id,
    createdAt: doc.createdAt,
    uploadedBy: {
      id: doc.uploadedBy.id,
      username: doc.uploadedBy.username,
      displayName,
      avatarUrl: profile?.avatarUrl ?? null,
    },
  };
}

/**
 * Service de gestion de la bibliothèque académique.
 */
export class LibraryService {
  private fileService = new FileService();
  private rag = new RagService();
  private folderResolver = new FolderResolverService();


  private visibilityWhere(role: string): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (role !== "admin" && role !== "staff") {
      where.moderationStatus = "APPROVED";
      where.isPublic = true;
    }
    return where;
  }

  /**
   * Contenu d'un niveau de l'explorateur : sous-dossiers + documents du dossier courant.
   */
  async browse(role: string, parentId?: string | null) {
    const pid = parentId ?? null;

    const folders = await prisma.folder.findMany({
      where: { parent_id: pid },
      orderBy: { name: "asc" },
    });

    const folderIds = folders.map((f) => f.id);
    const childCounts =
      folderIds.length > 0
        ? await prisma.folder.groupBy({
          by: ["parent_id"],
          where: { parent_id: { in: folderIds } },
          _count: { _all: true },
        })
        : [];

    const docCounts =
      folderIds.length > 0
        ? await prisma.document.groupBy({
          by: ["folder_id"],
          where: { folder_id: { in: folderIds }, ...this.visibilityWhere(role) },
          _count: { _all: true },
        })
        : [];

    const childMap = new Map(childCounts.map((c) => [c.parent_id!, c._count._all]));
    const docMap = new Map(docCounts.map((c) => [c.folder_id!, c._count._all]));

    const foldersOut = folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parent_id,
      subfolderCount: childMap.get(f.id) ?? 0,
      documentCount: docMap.get(f.id) ?? 0,
    }));

    let documents: ReturnType<typeof formatDocument>[] = [];
    if (pid) {
      const docs = await prisma.document.findMany({
        where: { folder_id: pid, ...this.visibilityWhere(role) },
        include: docInclude,
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      documents = docs.map(formatDocument);
    }

    return { folders: foldersOut, documents, currentFolderId: pid };
  }

  async getDocument(documentId: string, role: string, userId?: string) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: docInclude,
    });
    if (!doc) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    if (role !== "admin" && role !== "staff") {
      // Prevent access to other users' AI attachments (which are automatically APPROVED)
      if (doc.type === "AI_ATTACHMENT" && doc.uploaded_by_id !== userId) {
        throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Document non accessible." };
      }
      
      if (doc.moderationStatus !== "APPROVED" && doc.uploaded_by_id !== userId) {
        throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Document non accessible." };
      }
    }

    return formatDocument(doc);
  }

  async listMyDocuments(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const where = { uploaded_by_id: userId, type: { not: "AI_ATTACHMENT" } };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        include: docInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return { documents: documents.map(formatDocument), total };
  }

  async listDocuments(role: string, filters: Record<string, unknown>, page = 1, limit = 20) {
    const where: Record<string, any> = { ...this.visibilityWhere(role), status: "APPROVED" };

    if (filters.filiere) where.filiere = filters.filiere;
    if (filters.niveau) where.niveau = filters.niveau;
    if (filters.ue) where.ue = filters.ue;
    if (filters.type) {
      where.type = filters.type;
    } else {
      where.type = { not: "AI_ATTACHMENT" };
    }
    if (filters.year) where.year = Number(filters.year);

    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        include: docInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return { documents: documents.map(formatDocument), total };
  }

  async uploadDocument(userId: string, payload: Record<string, unknown>, file: Buffer, meta: { originalName: string; mimeType: string }) {
    const { filiere, niveau, ue } = payload as { filiere: string; niveau: string; ue: string };
    if (!filiere || !niveau || !ue) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        status: 400,
        message: "Filière, niveau et UE sont requis.",
      };
    }

    const folderId = await this.folderResolver.resolveFolderId(userId, filiere, niveau, ue);

    // --- Hash Deduplication Check ---
    const hash = crypto.createHash("sha256").update(file).digest("hex");
    const existingDoc = await prisma.document.findFirst({
      where: { hash }
    });

    let url: string;
    let size: number;

    if (existingDoc) {
      url = existingDoc.fileUrl;
      size = existingDoc.fileSize;
    } else {
      const stored = await this.fileService.storeDocument(file, meta.mimeType, meta.originalName);
      url = stored.url;
      size = stored.size;
    }

    const tags = payload.tags as string[] | undefined;
    const tagConnections = tags
      ? await Promise.all(
        tags.map((name: string) =>
          prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
        ),
      )
      : [];

    const document = await prisma.document.create({
      data: {
        folder_id: folderId,
        uploaded_by_id: userId,
        title: payload.title as string,
        description: (payload.description as string) ?? null,
        niveau: niveau,
        filiere: filiere,
        ue: ue,
        type: (payload.type as string) ?? "AUTRE",
        year: payload.year as number | undefined,
        fileUrl: url,
        fileName: meta.originalName,
        fileSize: size,
        mimeType: meta.mimeType,
        isPublic: (payload.isPublic as boolean) ?? true,
        tags: { connect: tagConnections.map((t) => ({ id: t.id })) },
        moderationStatus: "APPROVED",
        hash,
      },
      include: docInclude,
    });

    await prisma.auditLog.create({
      data: { user_id: userId, action: "DOCUMENT_UPLOADED", targetId: document.id },
    });

    await documentIngestionQueue.enqueue(document.id);

    return formatDocument(document);
  }

  async enqueueOutstandingIngestion() {
    return documentIngestionQueue.enqueueOutstanding();
  }

  async downloadDocument(documentId: string, role: string, userId?: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    if (role !== "admin" && role !== "staff") {
      if (doc.type === "AI_ATTACHMENT" && doc.uploaded_by_id !== userId) {
        throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Téléchargement non autorisé." };
      }
      if (doc.moderationStatus !== "APPROVED" && doc.uploaded_by_id !== userId) {
        throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Téléchargement non autorisé." };
      }
    }

    await Promise.all([
      prisma.document.update({ where: { id: documentId }, data: { downloadCount: { increment: 1 } } }),
      prisma.download.create({ data: { document_id: documentId, user_id: userId } }),
    ]);

    return { fileUrl: doc.fileUrl, downloadCount: doc.downloadCount + 1 };
  }

  async moderateDocument(documentId: string, decision: string, reason?: string) {
    return await prisma.document.update({
      where: { id: documentId },
      data: {
        moderationStatus: decision,
        rejectionReason: decision === "REJECTED" ? reason : null,
      },
    });
  }

  async deleteDocument(userId: string, role: string, documentId: string) {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    const canDelete = role === "admin" || role === "staff" || document.uploaded_by_id === userId;
    if (!canDelete) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisee." };

    await this.fileService.deleteFileByUrl(document.fileUrl);
    await prisma.document.delete({ where: { id: documentId } });

    // Suppression de l'index RAG en tâche de fond non-bloquante
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

  async searchDocuments(query: string, role: string) {
    const where: Record<string, any> = {
      ...this.visibilityWhere(role),
      type: { not: "AI_ATTACHMENT" },
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { ue: { contains: query, mode: "insensitive" } },
        { filiere: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    const docs = await prisma.document.findMany({
      where,
      include: docInclude,
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return docs.map(formatDocument);
  }

  /**
   * Recherche sémantique contextualisée via l'agent RAG (réservée PREMIUM).
   * Ne throw jamais : env absente ou agent injoignable → fallback structuré.
   */
  async semanticSearch(
    userId: string,
    role: string,
    query: string,
    filters?: Record<string, unknown>,
  ) {
    const FALLBACK = {
      results: [] as never[],
      message: "Fonctionnalité temporairement indisponible ou en maintenance.",
    };

    if (!this.rag.isAvailable()) return FALLBACK;

    try {
      const data = await this.rag.semanticSearch({ query, user_id: userId, filters: filters ?? {} });
      const ragResults = data.results ?? [];
      if (ragResults.length === 0) return { results: [] };

      // Ne renvoyer que les documents visibles par l'appelant
      const ids = ragResults.map((r) => r.document_id);
      const visibleDocs = await prisma.document.findMany({
        where: {
          id: { in: ids },
          ...this.visibilityWhere(role),
          type: { not: "AI_ATTACHMENT" },
        },
        include: docInclude,
      });
      const byId = new Map(visibleDocs.map((d) => [d.id, d]));

      return {
        results: ragResults
          .filter((r) => byId.has(r.document_id))
          .map((r) => ({
            document_id: r.document_id,
            title: r.title ?? byId.get(r.document_id)!.title,
            score: r.score ?? 0,
            excerpt: r.excerpt ?? "",
            document: formatDocument(byId.get(r.document_id)! as any),
          })),
      };
    } catch (err) {
      console.error("[RAG SemanticSearch] Falling back:", err);
      return FALLBACK;
    }
  }

  async getPopular(level?: string) {
    const where: Record<string, any> = {
      type: { not: "AI_ATTACHMENT" },
    };

    if(level) where.niveau = level;

    let documents = await prisma.document.findMany({
      orderBy: {
        downloadCount: "desc"
      },
      take: 10,
      where,
      include: docInclude
    })

    return { documents: [...documents.map(formatDocument)] };
  }

  async getRecommanded(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile: { select: { filiere: true, niveau: true } } },
    });
    const [userDocs, downloadRows] = await Promise.all([
      prisma.document.findMany({
        where: { uploaded_by_id: userId, type: { not: "AI_ATTACHMENT" } },
        select: { filiere: true, niveau: true, ue: true },
        take: 30, orderBy: { createdAt: "desc" },
      }),
      prisma.download.findMany({
        where: { user_id: userId }, select: { document_id: true },
        take: 30, orderBy: { createdAt: "desc" },
      }),
    ]);
    const downloadedDocs = downloadRows.length
      ? await prisma.document.findMany({
          where: { id: { in: downloadRows.map((row) => row.document_id) } },
          select: { filiere: true, niveau: true, ue: true },
        })
      : [];
    const signals = [...userDocs, ...downloadedDocs];
    const filieres = Array.from(new Set([user?.profile?.filiere, ...signals.map((doc) => doc.filiere)].filter(Boolean)));
    const niveaux = Array.from(new Set([user?.profile?.niveau, ...signals.map((doc) => doc.niveau)].filter(Boolean)));
    const ues = Array.from(new Set(signals.map((doc) => doc.ue).filter(Boolean)));
    const relevance: any[] = [];
    if (filieres.length) relevance.push({ filiere: { in: filieres } });
    if (niveaux.length) relevance.push({ niveau: { in: niveaux } });
    if (ues.length) relevance.push({ ue: { in: ues } });

    const docs = await prisma.document.findMany({
      where: {
        uploaded_by_id: { not: userId }, moderationStatus: "APPROVED", isPublic: true,
        type: { not: "AI_ATTACHMENT" }, ...(relevance.length ? { OR: relevance } : {}),
      },
      include: docInclude, orderBy: [{ downloadCount: "desc" }, { createdAt: "desc" }], take: 30,
    });
    return { documents: docs.map((doc) => {
      const formatted = formatDocument(doc);
      const reason = ues.includes(doc.ue) ? `Correspond à votre UE : `
        : filieres.includes(doc.filiere) && niveaux.includes(doc.niveau) ? "Correspond à votre filière et niveau"
        : filieres.includes(doc.filiere) ? "Correspond à votre filière"
        : "Populaire auprès d’étudiants similaires";
      return { ...formatted, recommendationReason: reason };
    }).sort((a, b) => Number(b.ue && ues.includes(b.ue)) - Number(a.ue && ues.includes(a.ue))).slice(0, 10) };
  }
}
