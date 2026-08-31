import { env } from "../../../config/envManager.js";
import type { DriverType, StorageDriver, UploadResult } from "../interface/storage-provider.interface.js";
import { LocalStorageDriver } from "../drivers/local.driver.js";
import { GoogleDriveStorageDriver } from "../drivers/google-drive.driver.js";
import { R2StorageDriver } from "../drivers/r2.driver.js";
import { GCSStorageDriver } from "../drivers/gcs.driver.js";

/**
 * Service de stockage — façade / factory.
 *
 * Résout le driver à utiliser :
 * 1. Si un `driver` est passé en paramètre → utilise ce driver.
 * 2. Sinon → utilise le driver par défaut défini par `STORAGE_SDK_DRIVER`.
 * 3. Si `STORAGE_SDK_DRIVER` n'est pas défini → fallback sur `local`.
 *
 * Les drivers sont instanciés paresseusement (lazy) à la première utilisation.
 */
export class StorageService {
  private drivers = new Map<DriverType, StorageDriver>();
  private defaultDriver: DriverType;

  constructor() {
    this.defaultDriver = (env.get("STORAGE_SDK_DRIVER") as DriverType | undefined) || "local";
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Upload un fichier via le driver spécifié (ou le driver par défaut).
   */
  async uploadFile(
    buffer: Buffer,
    name: string,
    mimeType: string,
    subDir?: string,
    driver?: DriverType,
  ): Promise<UploadResult> {
    const d = this.resolveDriver(driver);
    return d.uploadFile(buffer, name, mimeType, subDir);
  }

  /**
   * Récupère le contenu d'un fichier.
   */
  async getFile(key: string, driver?: DriverType): Promise<Buffer> {
    const d = this.resolveDriver(driver);
    return d.getFile(key);
  }

  /**
   * Supprime un fichier.
   */
  async deleteFile(key: string, driver?: DriverType): Promise<void> {
    const d = this.resolveDriver(driver);
    return d.deleteFile(key);
  }

  /**
   * Retourne le driver par défaut configuré.
   */
  getDefaultDriverType(): DriverType {
    return this.defaultDriver;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /**
   * Résout et instancie (lazy) le driver demandé.
   */
  private resolveDriver(driver?: DriverType): StorageDriver {
    const type = driver ?? this.defaultDriver;

    if (!this.drivers.has(type)) {
      this.drivers.set(type, this.createDriver(type));
    }

    return this.drivers.get(type)!;
  }

  /**
   * Factory de création de driver.
   */
  private createDriver(type: DriverType): StorageDriver {
    switch (type) {
      case "local":
        return new LocalStorageDriver();
      case "google-drive":
        return new GoogleDriveStorageDriver();
      case "r2":
        return new R2StorageDriver();
      case "gcs":
        return new GCSStorageDriver();
      default:
        throw new Error(`[StorageService] Driver inconnu : ${type}`);
    }
  }
}
