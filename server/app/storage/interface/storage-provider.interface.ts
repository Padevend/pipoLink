/**
 * Types et interface pour l'abstraction de stockage multi-driver.
 *
 * Chaque driver (local, Google Drive, R2, GCS) implémente `StorageDriver`.
 * Le `StorageService` résout le driver à utiliser via `STORAGE_SDK_DRIVER`
 * ou un paramètre explicite.
 */

/** Drivers de stockage disponibles. */
export type DriverType = "local" | "google-drive" | "r2" | "gcs";

/** Résultat retourné après un upload réussi. */
export interface UploadResult {
  /** URL accessible du fichier (relative pour local, absolue pour cloud). */
  url: string;
  /** Taille du fichier en octets. */
  size: number;
  /** Identifiant unique du fichier dans le driver (chemin relatif, fileId, object key…). */
  key: string;
}

/**
 * Interface que chaque driver de stockage doit implémenter.
 */
export interface StorageDriver {
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
