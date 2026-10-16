import { env } from "../../../config/envManager.js";
import type { DriverType, StorageDriver, StoredFile } from "../interface/storage-provider.interface.js";
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
  ): Promise<StoredFile> {
    const type = driver ?? this.defaultDriver;
    const result = await this.resolveDriver(type).uploadFile(buffer, name, mimeType, subDir);
    return { ...result, driver: type, reference: StorageService.toReference(type, result.key) };
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

  /** Lit un fichier à partir de sa référence opaque ou d'une ancienne URL. */
  async getFileByReference(reference: string): Promise<Buffer> {
    const { driver, key } = this.resolveReference(reference);
    return this.getFile(key, driver);
  }

  /** Supprime un fichier à partir de sa référence opaque ou d'une ancienne URL. */
  async deleteFileByReference(reference: string): Promise<void> {
    const { driver, key } = this.resolveReference(reference);
    return this.deleteFile(key, driver);
  }

  /** Fabrique une référence persistable sans exposer le provider au client. */
  static toReference(driver: DriverType, key: string): string {
    StorageService.assertKey(key);
    return `storage://${driver}/${encodeURIComponent(key)}`;
  }

  /**
   * Résout les références `storage://` actuelles et les formats historiques.
   * Cette compatibilité permet de déployer la correction sans migration urgente
   * des URLs déjà présentes en base.
   */
  resolveReference(reference: string): { driver: DriverType; key: string } {
    if (!reference || typeof reference !== "string") {
      throw new Error("[StorageService] Référence de fichier absente ou invalide.");
    }

    if (reference.startsWith("storage://")) {
      const url = new URL(reference);
      const driver = url.hostname as DriverType;
      if (!this.isKnownDriver(driver)) throw new Error("[StorageService] Driver de référence inconnu.");
      const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
      StorageService.assertKey(key);
      return { driver, key };
    }

    // Formats historiques locaux.
    if (reference.startsWith("/storage/")) {
      const key = reference.slice("/storage/".length);
      StorageService.assertKey(key);
      return { driver: "local", key };
    }

    // Ancien format interne R2 : r2://bucket/key.
    if (reference.startsWith("r2://")) {
      const key = reference.replace(/^r2:\/\/[^/]+\//, "");
      StorageService.assertKey(key);
      return { driver: "r2", key };
    }

    let url: URL;
    try {
      url = new URL(reference);
    } catch {
      throw new Error("[StorageService] Format de référence inconnu.");
    }

    const r2PublicUrl = env.get("R2_PUBLIC_URL") as string | undefined;
    if (
      url.hostname.endsWith(".r2.dev") ||
      (r2PublicUrl && reference.startsWith(r2PublicUrl.replace(/\/$/, "") + "/"))
    ) {
      const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
      StorageService.assertKey(key);
      return { driver: "r2", key };
    }

    if (url.hostname === "storage.googleapis.com") {
      const [, ...keyParts] = url.pathname.split("/").filter(Boolean);
      const key = decodeURIComponent(keyParts.join("/"));
      StorageService.assertKey(key);
      return { driver: "gcs", key };
    }

    // `webContentLink` Drive a changé de domaine au fil des versions.
    if (
      url.hostname === "drive.google.com" ||
      url.hostname === "drive.usercontent.google.com" ||
      url.hostname.endsWith(".googleusercontent.com")
    ) {
      const key = url.searchParams.get("id") || url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
      if (!key) throw new Error("[StorageService] Identifiant Google Drive introuvable.");
      StorageService.assertKey(key);
      return { driver: "google-drive", key };
    }

    throw new Error("[StorageService] Provider non reconnu pour cette référence.");
  }

  /**
   * Retourne le driver par défaut configuré.
   */
  getDefaultDriverType(): DriverType {
    return this.defaultDriver;
  }

  async uploadWithFallback(buffer: Buffer, name: string, mimeType: string, subDir: string, chain: DriverType[]): Promise<StoredFile> {
    const errors: string[] = [];
    for (const type of [...new Set(chain)]) {
      try {
        const driver = this.resolveDriver(type);
        if (!driver.isConfigured()) { errors.push(`${type}: non configuré`); continue; }
        const result = await driver.uploadFile(buffer, name, mimeType, subDir);
        return { ...result, driver: type, reference: StorageService.toReference(type, result.key) };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${type}: ${message}`);
        console.error(`[StorageService] upload ${type} échoué, fallback suivant`, error);
      }
    }
    throw new Error(`Aucun provider de stockage disponible (${errors.join(" | ")})`);
  }

  getConfiguredDrivers(): DriverType[] {
    return (["local", "r2", "gcs", "google-drive"] as DriverType[]).filter((type) => this.resolveDriver(type).isConfigured());
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

  private isKnownDriver(value: string): value is DriverType {
    return ["local", "google-drive", "r2", "gcs"].includes(value);
  }

  private static assertKey(key: string): void {
    if (!key || key.includes("\0") || key.split("/").some((part) => part === "..")) {
      throw new Error("[StorageService] Clé de fichier invalide.");
    }
  }
}
