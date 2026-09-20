import { Storage } from "@google-cloud/storage";
import { env } from "../../../config/envManager.js";
import type { StorageDriver, UploadResult } from "../interface/storage-provider.interface.js";

/**
 * Driver Google Cloud Storage.
 *
 * Variables d'environnement requises :
 * - GCS_BUCKET_NAME
 * - GCS_PROJECT_ID (optionnel si les credentials par défaut sont configurées)
 * - GCS_KEY_FILE_PATH (optionnel — chemin vers le fichier de clé de service)
 */
export class GCSStorageDriver implements StorageDriver {
  private storage: Storage;
  private bucket: string;
  private configured = false;

  constructor() {
    this.bucket = (env.get("GCS_BUCKET_NAME") as string | undefined) || "";
    const projectId = env.get("GCS_PROJECT_ID") as string | undefined;
    const keyFilePath = env.get("GCS_KEY_FILE_PATH") as string | undefined;

    this.configured = !!this.bucket;
    if (!this.configured) {
      console.warn("[GCSDriver] GCS_BUCKET_NAME manquant. Le driver ne sera pas opérationnel.");
    }

    const storageConfig: ConstructorParameters<typeof Storage>[0] = {};
    if (projectId) storageConfig.projectId = projectId;
    if (keyFilePath) storageConfig.keyFilename = keyFilePath;

    this.storage = new Storage(storageConfig);
  }

  isConfigured(): boolean { return this.configured; }

  async uploadFile(buffer: Buffer, name: string, mimeType: string, subDir?: string): Promise<UploadResult> {
    if (!this.configured) throw new Error("[GCSDriver] Driver non configuré.");
    const key = subDir ? `${subDir}/${name}` : name;
    const bucketRef = this.storage.bucket(this.bucket);
    const file = bucketRef.file(key);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      resumable: false,
    });

    const url = `https://storage.googleapis.com/${this.bucket}/${key}`;

    return { url, size: buffer.length, key };
  }

  async getFile(key: string): Promise<Buffer> {
    const bucketRef = this.storage.bucket(this.bucket);
    const file = bucketRef.file(key);

    const [contents] = await file.download();
    return contents;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const bucketRef = this.storage.bucket(this.bucket);
      const file = bucketRef.file(key);
      await file.delete();
    } catch (err) {
      console.error(`[GCSDriver] Échec de suppression du fichier ${key}:`, err);
    }
  }
}
