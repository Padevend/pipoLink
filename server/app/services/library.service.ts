import { prisma }       from "../../config/database.js";
import { FileService }  from "./file.service.js";
import { ErrorCode }    from "../helpers/error-codes.js";

/**
 * Service de gestion de la bibliothèque académique.
 */
export class LibraryService {
  private fileService = new FileService();

  /**
   * Liste les documents d'un dossier avec filtres et pagination.
   * N'affiche que les documents APPROVED aux rôles non-admin.
   */
  async listDocuments(folderId: string, role: string, filters: Record<string, any>, page = 1, limit = 20) {
    const where: Record<string, any> = { folder_id: folderId };

    if (role !== "admin" && role !== "staff") {
      where.moderationStatus = "APPROVED";
      where.isPublic = true;
    }

    if (filters.type)   where.type   = filters.type;
    if (filters.niveau) where.niveau = filters.niveau;
    if (filters.year)   where.year   = Number(filters.year);

    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where, skip, take: limit,
        include: { uploadedBy: { select: { username: true } }, tags: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return { documents, total };
  }

  /**
   * Upload un document avec validation du fichier via FileService.
   */
  async uploadDocument(userId: string, payload: any, file: Buffer, meta: { originalName: string; mimeType: string }) {
    const { url, size } = await this.fileService.storeDocument(file, meta.mimeType);

    const tagConnections = payload.tags
      ? await Promise.all(
          (payload.tags as string[]).map((name: string) =>
            prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
          )
        )
      : [];

    const document = await prisma.document.create({
      data: {
        folder_id:      payload.folderId,
        uploaded_by_id: userId,
        title:          payload.title,
        description:    payload.description,
        niveau:         payload.niveau,
        filiere:        payload.filiere,
        ue:             payload.ue,
        type:           payload.type ?? "AUTRE",
        year:           payload.year,
        fileUrl:        url,
        fileName:       meta.originalName,
        fileSize:       size,
        mimeType:       meta.mimeType,
        isPublic:       payload.isPublic ?? true,
        tags:           { connect: tagConnections.map((t) => ({ id: t.id })) },
      },
      include: { tags: true },
    });

    await prisma.auditLog.create({ data: { user_id: userId, action: "DOCUMENT_UPLOADED", targetId: document.id } });

    return document;
  }

  /**
   * Enregistre le téléchargement et retourne l'URL du fichier.
   */
  async downloadDocument(documentId: string, userId?: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    await Promise.all([
      prisma.document.update({ where: { id: documentId }, data: { downloadCount: { increment: 1 } } }),
      prisma.download.create({ data: { document_id: documentId, user_id: userId } }),
    ]);

    return { fileUrl: doc.fileUrl };
  }

  /**
   * Modère un document (APPROVED ou REJECTED).
   */
  async moderateDocument(documentId: string, decision: string, reason?: string) {
    return await prisma.document.update({
      where: { id: documentId },
      data:  {
        moderationStatus: decision as any,
        rejectionReason:  decision === "REJECTED" ? reason : null,
      },
    });
  }

  /**
   * Met a jour les metadonnees d'un document.
   */
  async updateDocument(userId: string, role: string, documentId: string, payload: any) {
    const document = await prisma.document.findUnique({ where: { id: documentId }, include: { tags: true } });
    if (!document) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    const canEdit = role === "admin" || role === "staff" || document.uploaded_by_id === userId;
    if (!canEdit) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisee." };

    const tagConnections = payload.tags
      ? await Promise.all(
          (payload.tags as string[]).map((name: string) =>
            prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
          )
        )
      : [];

    return await prisma.document.update({
      where: { id: documentId },
      data: {
        title: payload.title,
        description: payload.description,
        niveau: payload.niveau,
        filiere: payload.filiere,
        ue: payload.ue,
        type: payload.type,
        year: payload.year,
        isPublic: payload.isPublic,
        tags: payload.tags ? { set: tagConnections.map((t) => ({ id: t.id })) } : undefined,
      },
      include: { tags: true },
    });
  }

  /**
   * Supprime un document.
   */
  async deleteDocument(userId: string, role: string, documentId: string) {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    const canDelete = role === "admin" || role === "staff" || document.uploaded_by_id === userId;
    if (!canDelete) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisee." };

    await prisma.document.delete({ where: { id: documentId } });
  }

  /**
   * Recherche des documents par texte libre.
   */
  async searchDocuments(query: string, role: string) {
    const where: Record<string, any> = {
      OR: [
        { title:       { contains: query, mode: "insensitive" } },
        { ue:          { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    if (role !== "admin" && role !== "staff") where.moderationStatus = "APPROVED";

    return await prisma.document.findMany({ where, include: { tags: true }, take: 20 });
  }
}
