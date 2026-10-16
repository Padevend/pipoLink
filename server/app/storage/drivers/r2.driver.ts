import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../../../config/envManager.js";
import type { StorageDriver, UploadResult } from "../interface/storage-provider.interface.js";

/**
 * Driver Cloudflare R2 — S3-compatible.
 *
 * Variables d'environnement requises :
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_URL (optionnel — uniquement pour reconnaître les anciennes URLs)
 */
export class R2StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private configured = false;

  constructor() {
    const accountId = env.get("R2_ACCOUNT_ID") as string | undefined;
    const accessKeyId = env.get("R2_ACCESS_KEY_ID") as string | undefined;
    const secretAccessKey = env.get("R2_SECRET_ACCESS_KEY") as string | undefined;
    this.bucket = (env.get("R2_BUCKET_NAME") as string | undefined) || "";

    this.configured = !!(accountId && accessKeyId && secretAccessKey && this.bucket);
    if (!this.configured) {
      console.warn("[R2Driver] Configuration incomplète. Le driver ne sera pas opérationnel.");
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : undefined,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
    });
  }

  isConfigured(): boolean { return this.configured; }

  async uploadFile(buffer: Buffer, name: string, mimeType: string, subDir?: string): Promise<UploadResult> {
    if (!this.configured) throw new Error("[R2Driver] Driver non configuré.");
    const key = subDir ? `${subDir}/${name}` : name;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return { size: buffer.length, key };
  }

  async getFile(key: string): Promise<Buffer> {
    if (!this.configured) throw new Error("[R2Driver] Driver non configuré.");
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!res.Body) {
      throw new Error(`[R2Driver] Fichier introuvable : ${key}`);
    }

    // Convertir le ReadableStream en Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.configured) throw new Error("[R2Driver] Driver non configuré.");
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
