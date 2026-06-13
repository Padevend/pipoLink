import sharp from "sharp";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { env } from "../../config/envManager.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { GoogleDriveService } from "./google-drive.service.js";

/**
 * Service de gestion des fichiers uploadés.
 * Validation MIME, taille, extension.
 * Traitement des images via Sharp.
 * Stockage local dans le dossier STORAGE_PATH ou Google Drive.
 */
export class FileService {
  private driveService = new GoogleDriveService();

  // Extensions et MIME types autorisés par catégorie
  private readonly ALLOWED_DOCUMENTS = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  private readonly ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

  /**
   * Traite et enregistre l'avatar d'un utilisateur.
   * Redimensionne en 256x256 pixels, convertit en WebP.
   *
   * @param userId - Identifiant de l'utilisateur (utilisé pour nommer le fichier)
   * @param buffer - Buffer de l'image uploadée
   * @returns      - URL relative du fichier enregistré
   */
  async processAvatar(userId: string, buffer: Buffer): Promise<string> {
    const outputPath = this._ensureDir("avatars");
    const fileName   = `${userId}.webp`;
    const filePath   = path.join(outputPath, fileName);

    await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(filePath);

    return `/storage/avatars/${fileName}`;
  }

  /**
   * Valide et enregistre un document académique.
   * Vérifie le type MIME, la taille maximale.
   * Si Google Drive est configuré, sauvegarde le fichier sur Drive.
   * Sinon, stocke localement en mode fallback.
   *
   * @param buffer       - Buffer du fichier
   * @param originalName - Nom original du fichier
   * @param mimeType     - Type MIME déclaré par le client
   * @returns            - { url, size }
   * @throws             - INVALID_FILE_TYPE, FILE_TOO_LARGE
   */
  async storeDocument(buffer: Buffer, mimeType: string, originalName?: string): Promise<{ url: string; size: number }> {
    this._validateMime(mimeType, [...this.ALLOWED_DOCUMENTS, ...this.ALLOWED_IMAGES]);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const ext      = mime.extension(mimeType) || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const driveName = originalName ? `${Date.now()}-${originalName}` : fileName;

    if (this.driveService.isConfigured) {
      try {
        const driveResult = await this.driveService.uploadFile(buffer, driveName, mimeType);
        return { url: driveResult.url, size: driveResult.size };
      } catch (error) {
        console.error("Google Drive upload failed, falling back to local storage:", error);
      }
    }

    const dir      = this._ensureDir("documents");
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, buffer);

    return { url: `/storage/documents/${fileName}`, size: buffer.length };
  }

  /**
   * Stocke une pièce jointe de message déjà chiffrée côté client (blob binaire).
   */
  async storeMessageAttachment(buffer: Buffer): Promise<{ url: string; size: number }> {
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.enc`;
    const dir      = this._ensureDir("message-attachments");
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, buffer);

    return { url: `/storage/message-attachments/${fileName}`, size: buffer.length };
  }

  /**
   * Traite et enregistre l'affiche d'une annonce.
   */
  async saveAnnouncementPoster(buffer: Buffer, mimeType: string, quality: number): Promise<string> {
    this._validateMime(mimeType, this.ALLOWED_IMAGES);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const outputPath = this._ensureDir("announcements");
    const fileName   = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const filePath   = path.join(outputPath, fileName);

    await sharp(buffer)
      .webp({ quality: quality })
      .toFile(filePath);

    return `/storage/announcements/${fileName}`;
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Vérifie que le type MIME est dans la liste blanche.
   *
   * @throws FILE_INVALID_TYPE (422) si non autorisé
   */
  private _validateMime(mimeType: string, allowed: string[]) {
    if (!allowed.includes(mimeType)) {
      throw { code: ErrorCode.INVALID_FILE_TYPE, status: 422, message: `Type de fichier non autorisé : ${mimeType}` };
    }
  }

  /**
   * Vérifie que la taille du fichier ne dépasse pas le maximum autorisé.
   *
   * @throws FILE_TOO_LARGE (413) si dépassement
   */
  private _validateSize(sizeBytes: number, maxBytes: number) {
    if (sizeBytes > maxBytes) {
      throw { code: ErrorCode.FILE_TOO_LARGE, status: 413, message: `Fichier trop volumineux. Maximum : ${maxBytes / 1024 / 1024} MB.` };
    }
  }

  /**
   * Crée le répertoire de stockage si inexistant et retourne son chemin.
   *
   * @param subDir - Sous-répertoire dans STORAGE_PATH
   */
  private _ensureDir(subDir: string): string {
    const dir = path.join(env.get("STORAGE_PATH"), subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}
