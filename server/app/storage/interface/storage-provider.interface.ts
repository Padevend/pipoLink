/**
 * Types et interface pour l'abstraction de stockage multi-driver.
 *
 * Chaque driver (local, Google Drive, R2, GCS) implémente `StorageDriver`.
 * Le `StorageService` résout le driver à utiliser via `STORAGE_SDK_DRIVER`
 * ou un paramètre explicite.
 */

/** Drivers de stockage disponibles. */
export type DriverType = "local" | "google-drive" | "r2" | "gcs";

/** Résultat brut retourné par un provider après un upload réussi. */
export interface UploadResult {
  /** Taille du fichier en octets. */
  size: number;
  /** Identifiant unique du fichier dans le driver (chemin relatif, fileId, object key…). */
  key: string;
}

/**
 * Référence indépendante du provider, persistée en base de données.
 *
 * Elle ne constitue pas une URL publique. Les clients reçoivent toujours une
 * route applicative autorisée (`/files/...`) et non l'adresse du bucket.
 */
export interface StoredFile extends UploadResult {
  driver: DriverType;
  reference: string;
}

/**
 * Interface que chaque driver de stockage doit implémenter.
 */
export interface StorageDriver {
  isConfigured(): boolean;
  /**
   * Upload un fichier.
   *
   * @param buffer   - Contenu binaire du fichier
   * @param name     - Nom du fichier (avec extension)
   * @param mimeType - Type MIME du fichier
   * @param subDir   - Sous-répertoire / préfixe optionnel (ex: "avatars", "documents")
   */
  uploadFile(buffer: Buffer, name: string, mimeType: string, subDir?: string): Promise<UploadResult>;

  /**
   * Récupère le contenu d'un fichier.
   *
   * @param key - Identifiant unique retourné par `uploadFile`
   */
  getFile(key: string): Promise<Buffer>;

  /**
   * Supprime un fichier.
   *
   * @param key - Identifiant unique retourné par `uploadFile`
   */
  deleteFile(key: string): Promise<void>;
}
