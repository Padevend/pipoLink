import fs from "fs";
import path from "path";
import { env } from "../../../config/envManager.js";
import type { StorageDriver, UploadResult } from "../interface/storage-provider.interface.js";

/**
 * Driver de stockage local — écrit les fichiers dans `STORAGE_PATH`.
 *
 * Structure : STORAGE_PATH/<subDir>/<name>
 * URL retournée : /storage/<subDir>/<name>
 * Key retournée : <subDir>/<name>
 */
export class LocalStorageDriver implements StorageDriver {
  private readonly storagePath: string;

  constructor() {
    this.storagePath = env.get("STORAGE_PATH") || "./storage";
  }

  async uploadFile(buffer: Buffer, name: string, _mimeType: string, subDir?: string): Promise<UploadResult> {
    const dir = subDir
      ? path.join(this.storagePath, subDir)
      : this.storagePath;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, buffer);

    const key = subDir ? `${subDir}/${name}` : name;

    return {
      url: `/storage/${key}`,
      size: buffer.length,
      key,
    };
  }

  async getFile(key: string): Promise<Buffer> {
    const filePath = path.join(this.storagePath, key);
    const resolvedStorage = path.resolve(this.storagePath);
    const resolvedFile = path.resolve(filePath);

    // Protection traversal
    if (!resolvedFile.startsWith(resolvedStorage)) {
      throw new Error(`[LocalDriver] Path traversal attempt blocked: ${key}`);
    }

    if (!fs.existsSync(resolvedFile)) {
      throw new Error(`[LocalDriver] File not found: ${key}`);
    }

    return fs.readFileSync(resolvedFile);
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.storagePath, key);
    const resolvedStorage = path.resolve(this.storagePath);
    const resolvedFile = path.resolve(filePath);

    // Protection traversal
    if (!resolvedFile.startsWith(resolvedStorage)) {
      console.error(`[LocalDriver][Security] Path traversal attempt blocked: ${key}`);
      return;
    }

    if (fs.existsSync(resolvedFile)) {
      fs.unlinkSync(resolvedFile);
    }
  }
}
