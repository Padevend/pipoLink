import sharp from "sharp";
import mime from "mime-types";
import crypto from "node:crypto";
import { env } from "../../config/envManager.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { StorageService } from "../storage/services/storage.service.js";
import type { DriverType } from "../storage/interface/storage-provider.interface.js";


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
   * @returns      - Référence opaque du fichier enregistré
   */
  async processAvatar(userId: string, buffer: Buffer, driver?: DriverType): Promise<string> {
    const processed = await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${userId}-${crypto.randomUUID()}.webp`;
    const result = await this.upload(processed, fileName, "image/webp", "avatars", "static", driver);
    return result.reference;
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
  async storeDocument(buffer: Buffer, mimeType: string, originalName?: string, driver?: DriverType): Promise<{ reference: string; size: number }> {
    this._validateMime(mimeType, [...this.ALLOWED_DOCUMENTS, ...this.ALLOWED_IMAGES]);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const ext      = mime.extension(mimeType) || "bin";
    const fileName = this.uniqueFileName(ext);

    const result = await this.upload(buffer, fileName, mimeType, "documents", "library", driver);
    return { reference: result.reference, size: result.size };
  }

  /**
   * Stocke une pièce jointe de message déjà chiffrée côté client (blob binaire).
   */
  async storeMessageAttachment(buffer: Buffer, driver?: DriverType): Promise<{ reference: string; size: number }> {
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const fileName = this.uniqueFileName("enc");
    const result = await this.upload(buffer, fileName, "application/octet-stream", "message-attachments", "static", driver);
    return { reference: result.reference, size: result.size };
  }

  /**
   * Stocke un document personnel pour l'IA.
   * Par défaut utilise le driver Google Drive (si configuré) via le paramètre driver,
   * sinon utilise le driver par défaut.
   */
  async storeAiAttachment(buffer: Buffer, mimeType: string, originalName?: string, driver?: DriverType): Promise<{ reference: string; size: number }> {
    this._validateMime(mimeType, [...this.ALLOWED_DOCUMENTS, ...this.ALLOWED_IMAGES]);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const ext      = mime.extension(mimeType) || "bin";
    const fileName = this.uniqueFileName(ext);

    const result = await this.upload(buffer, fileName, mimeType, "ai-attachments", "ai", driver);
    return { reference: result.reference, size: result.size };
  }

  /**
   * Supprime un fichier à partir de sa référence opaque. Les anciennes URLs
   * restent supportées par `StorageService` durant la période de migration.
   */
  async deleteFileByReference(reference: string): Promise<void> {
    await this.storage.deleteFileByReference(reference);
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

    const fileName = this.uniqueFileName("webp");
    const result = await this.upload(processed, fileName, "image/webp", "announcements", "static", driver);
    return result.reference;
  }

  private chain(kind: "static" | "library" | "ai"): DriverType[] {
    // Politique de placement :
    // - bibliothèque académique : Google Drive, puis volume local de secours ;
    // - assets applicatifs (avatars, messages, annonces, IA) : R2, puis local.
    // Le driver GCS reste disponible pour une sélection explicite, mais ne
    // s'insère jamais dans la chaîne automatique afin d'éviter une dispersion
    // des fichiers entre plusieurs providers.
    if (kind === "library") return ["google-drive", "local"];
    return ["r2", "local"];
  }

  private async upload(buffer: Buffer, name: string, mimeType: string, subDir: string, kind: "static" | "library" | "ai", driver?: DriverType) {
    return driver ? this.storage.uploadFile(buffer, name, mimeType, subDir, driver) : this.storage.uploadWithFallback(buffer, name, mimeType, subDir, this.chain(kind));
  }

  private uniqueFileName(extension: string): string {
    const normalized = extension.replace(/^\./, "") || "bin";
    return `${crypto.randomUUID()}.${normalized}`;
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
