import sharp from "sharp";
import mime from "mime-types";
import { env } from "../../config/envManager.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { StorageService } from "../storage/services/storage.service.js";
import type { DriverType } from "../storage/interface/storage-provider.interface.js";

/**
 * Service de gestion des fichiers uploadés.
 * Validation MIME, taille, extension.
 * Traitement des images via Sharp.
 * Délègue le stockage brut au StorageService (multi-driver).
 */
export class FileService {
  private storage = new StorageService();

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
   * @param driver - Driver de stockage à utiliser (optionnel)
   * @returns      - URL relative du fichier enregistré
   */
  async processAvatar(userId: string, buffer: Buffer, driver?: DriverType): Promise<string> {
    const processed = await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${userId}.webp`;
    const result = await this.upload(processed, fileName, "image/webp", "avatars", "static", driver);
    return result.url;
  }

  /**
   * Valide et enregistre un document académique.
   * Vérifie le type MIME, la taille maximale.
   * Utilise le driver spécifié ou le driver par défaut.
   *
   * @param buffer       - Buffer du fichier
   * @param mimeType     - Type MIME déclaré par le client
   * @param originalName - Nom original du fichier
   * @param driver       - Driver de stockage à utiliser (optionnel)
   * @returns            - { url, size }
   * @throws             - INVALID_FILE_TYPE, FILE_TOO_LARGE
   */
  async storeDocument(buffer: Buffer, mimeType: string, originalName?: string, driver?: DriverType): Promise<{ url: string; size: number }> {
    this._validateMime(mimeType, [...this.ALLOWED_DOCUMENTS, ...this.ALLOWED_IMAGES]);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const ext      = mime.extension(mimeType) || "bin";
    const fileName = originalName
      ? `${Date.now()}-${originalName}`
      : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const result = await this.upload(buffer, fileName, mimeType, "documents", "library", driver);
    return { url: result.url, size: result.size };
  }

  /**
   * Stocke une pièce jointe de message déjà chiffrée côté client (blob binaire).
   */
  async storeMessageAttachment(buffer: Buffer, driver?: DriverType): Promise<{ url: string; size: number }> {
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.enc`;
    const result = await this.upload(buffer, fileName, "application/octet-stream", "message-attachments", "static", driver);
    return { url: result.url, size: result.size };
  }

  /**
   * Stocke un document personnel pour l'IA.
   * Par défaut utilise le driver Google Drive (si configuré) via le paramètre driver,
   * sinon utilise le driver par défaut.
   */
  async storeAiAttachment(buffer: Buffer, mimeType: string, originalName?: string, driver?: DriverType): Promise<{ url: string; size: number }> {
    this._validateMime(mimeType, [...this.ALLOWED_DOCUMENTS, ...this.ALLOWED_IMAGES]);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const ext      = mime.extension(mimeType) || "bin";
    const fileName = originalName
      ? `${Date.now()}-${originalName}`
      : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const result = await this.upload(buffer, fileName, mimeType, "ai-attachments", "ai", driver);
    return { url: result.url, size: result.size };
  }

  /**
   * Supprime un fichier à partir de son URL ou key.
   *
   * Détecte le driver à utiliser en fonction du format de l'URL :
   * - `/storage/...` → local
   * - `drive.google.com` → google-drive
   * - `r2://...` ou URL publique R2 → r2
   * - `storage.googleapis.com` → gcs
   */
  async deleteFileByUrl(fileUrl: string): Promise<void> {
    if (fileUrl.startsWith("/storage/")) {
      // Local file — key = chemin relatif après /storage/
      const key = fileUrl.replace("/storage/", "");
      await this.storage.deleteFile(key, "local");
    } else if (fileUrl.includes("drive.google.com")) {
      // Google Drive — extraire le fileId
      try {
        const urlObj = new URL(fileUrl);
        let fileId = urlObj.searchParams.get("id");
        if (!fileId && urlObj.pathname.includes("/file/d/")) {
          const parts = urlObj.pathname.split("/file/d/");
          if (parts[1]) fileId = parts[1].split("/")[0];
        }
        if (fileId) {
          await this.storage.deleteFile(fileId, "google-drive");
        }
      } catch (err) {
        console.error("Failed to delete drive file by URL:", err);
      }
    } else if (fileUrl.startsWith("r2://") || fileUrl.includes(".r2.dev/")) {
      // R2 — extraire le key
      let key: string;
      if (fileUrl.startsWith("r2://")) {
        // r2://bucket/key → key
        key = fileUrl.replace(/^r2:\/\/[^/]+\//, "");
      } else {
        // URL publique — extraire le path
        const urlObj = new URL(fileUrl);
        key = urlObj.pathname.replace(/^\//, "");
      }
      await this.storage.deleteFile(key, "r2");
    } else if (fileUrl.includes("storage.googleapis.com")) {
      // GCS — extraire le key depuis l'URL
      try {
        const urlObj = new URL(fileUrl);
        // Format: https://storage.googleapis.com/BUCKET/KEY
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        // Retirer le nom du bucket (premier segment)
        const key = pathParts.slice(1).join("/");
        await this.storage.deleteFile(key, "gcs");
      } catch (err) {
        console.error("Failed to delete GCS file by URL:", err);
      }
    }
  }

  /**
   * Traite et enregistre l'affiche d'une annonce.
   */
  async saveAnnouncementPoster(buffer: Buffer, mimeType: string, quality: number, driver?: DriverType): Promise<string> {
    this._validateMime(mimeType, this.ALLOWED_IMAGES);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const processed = await sharp(buffer)
      .webp({ quality })
      .toBuffer();

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const result = await this.upload(processed, fileName, "image/webp", "announcements", "static", driver);
    return result.url;
  }

  private chain(kind: "static" | "library" | "ai"): DriverType[] {
    const development = (env.get("NODE_ENV") || "development") === "development";
    if (kind === "library") return development ? ["local", "google-drive", "r2", "gcs"] : ["google-drive", "r2", "gcs", "local"];
    return development ? ["local", "r2", "gcs"] : ["r2", "gcs", "local"];
  }

  private async upload(buffer: Buffer, name: string, mimeType: string, subDir: string, kind: "static" | "library" | "ai", driver?: DriverType) {
    return driver ? this.storage.uploadFile(buffer, name, mimeType, subDir, driver) : this.storage.uploadWithFallback(buffer, name, mimeType, subDir, this.chain(kind));
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
}
