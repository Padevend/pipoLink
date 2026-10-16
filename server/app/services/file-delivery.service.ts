import { prisma } from "../../config/database.js";
import { StorageService } from "../storage/services/storage.service.js";

export type FileDelivery = {
  reference: string;
  fileName: string;
  mimeType: string;
  disposition: "inline" | "attachment";
  cacheControl: string;
};

/**
 * Résout une ressource métier vers un fichier après avoir appliqué son ACL.
 * La clé/provider de stockage ne quitte jamais cette couche.
 */
export class FileDeliveryService {
  private readonly storage = new StorageService();

  async avatar(userId: string): Promise<FileDelivery> {
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: userId },
      select: { avatarUrl: true },
    });
    if (!profile?.avatarUrl) throw this.notFound();
    console.log(JSON.stringify(profile, null, 2))
    return {
      reference: profile.avatarUrl,
      fileName: "avatar.webp",
      mimeType: "image/webp",
      disposition: "inline",
      cacheControl: "private, max-age=300",
    };
  }

  async messageAttachment(attachmentId: string, userId: string): Promise<FileDelivery> {
    const attachment = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: { message: { select: { chat_id: true } } },
    });
    if (!attachment) throw this.notFound();

    const member = await prisma.conversationMember.findFirst({
      where: { conversation_id: attachment.message.chat_id, user_id: userId },
      select: { id: true },
    });
    if (!member) throw this.forbidden();

    return {
      reference: attachment.file_url,
      fileName: attachment.file_name,
      // Une pièce jointe de chat est chiffrée côté client : ne pas l'afficher
      // comme une image même si le MIME initial le suggère.
      mimeType: "application/octet-stream",
      disposition: "attachment",
      cacheControl: "private, no-store",
    };
  }

  async document(documentId: string, userId: string, role: string, aiOnly = false): Promise<FileDelivery> {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw this.notFound();
    if (aiOnly && document.type !== "AI_ATTACHMENT") throw this.notFound();
    if (!aiOnly && document.type === "AI_ATTACHMENT") throw this.notFound();

    const staff = role === "admin" || role === "staff";
    const owner = document.uploaded_by_id === userId;
    const visibleToMember = document.type !== "AI_ATTACHMENT" && document.isPublic && document.moderationStatus === "APPROVED";
    if (!staff && !owner && !visibleToMember) throw this.forbidden();

    return {
      reference: document.fileUrl,
      fileName: document.fileName,
      mimeType: document.mimeType || "application/octet-stream",
      disposition: this.isInlineable(document.mimeType) ? "inline" : "attachment",
      cacheControl: "private, no-store",
    };
  }

  async announcement(announcementId: string, variant: "poster" | "preview"): Promise<FileDelivery> {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { poster: true, previewUrl: true },
    });
    const reference = variant === "poster" ? announcement?.poster : announcement?.previewUrl;
    if (!reference) throw this.notFound();
    return {
      reference,
      fileName: variant === "poster" ? "announcement.webp" : "announcement-preview.webp",
      mimeType: "image/webp",
      disposition: "inline",
      cacheControl: "private, max-age=300",
    };
  }

  async read(delivery: FileDelivery): Promise<Buffer> {
    return this.storage.getFileByReference(delivery.reference);
  }

  private isInlineable(mimeType: string): boolean {
    return mimeType.startsWith("image/") || mimeType === "application/pdf";
  }

  private notFound() {
    return { code: "NOT_FOUND", status: 404, message: "Fichier introuvable." };
  }

  private forbidden() {
    return { code: "FORBIDDEN", status: 403, message: "Vous n’êtes pas autorisé à accéder à ce fichier." };
  }
}
