import fs from "fs";
import path from "path";
import { env } from "../../../config/envManager.js";
import type { StorageDriver, UploadResult } from "../interface/storage-provider.interface.js";

/**
 * Driver de stockage local — écrit les fichiers dans `STORAGE_PATH`.
 *
 * Structure : STORAGE_PATH/<subDir>/<name>
 * Le driver ne publie aucune URL : le service retourne une référence opaque.
 * Key retournée : <subDir>/<name>
 */
export class LocalStorageDriver implements StorageDriver {
  private readonly storagePath: string;

  constructor() {
    this.storagePath = env.get("STORAGE_PATH") || "./storage";
  }

  isConfigured(): boolean { return true; }


  async uploadFile(buffer: Buffer, name: string, _mimeType: string, subDir?: string): Promise<UploadResult> {
    this.assertSafeRelativePath(name);
    if (subDir) this.assertSafeRelativePath(subDir);
    const dir = subDir
      ? path.join(this.storagePath, subDir)
      : this.storagePath;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, buffer);

    const key = subDir ? `${subDir}/${name}` : name;

    return { size: buffer.length, key };
  }

  async getFile(key: string): Promise<Buffer> {
    this.assertSafeRelativePath(key);
    const filePath = path.join(this.storagePath, key);
    const resolvedStorage = path.resolve(this.storagePath);
    const resolvedFile = path.resolve(filePath);

    // Protection traversal
    if (!resolvedFile.startsWith(`${resolvedStorage}${path.sep}`)) {
      throw new Error(`[LocalDriver] Path traversal attempt blocked: ${key}`);
    }

    if (!fs.existsSync(resolvedFile)) {
      throw new Error(`[LocalDriver] File not found: ${key}`);
    }

    return fs.readFileSync(resolvedFile);
  }

  async deleteFile(key: string): Promise<void> {
    this.assertSafeRelativePath(key);
    const filePath = path.join(this.storagePath, key);
    const resolvedStorage = path.resolve(this.storagePath);
    const resolvedFile = path.resolve(filePath);

    // Protection traversal
    if (!resolvedFile.startsWith(`${resolvedStorage}${path.sep}`)) {
      console.error(`[LocalDriver][Security] Path traversal attempt blocked: ${key}`);
      return;
    }

    if (fs.existsSync(resolvedFile)) {
      fs.unlinkSync(resolvedFile);
    }
  }

  private assertSafeRelativePath(value: string): void {
    if (!value || path.isAbsolute(value) || value.split(/[\\/]/).some((part) => part === ".." || !part)) {
      throw new Error(`[LocalDriver] Clé de fichier invalide: ${value}`);
    }
  }
}
