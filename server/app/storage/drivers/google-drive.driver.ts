import { google, drive_v3 } from "googleapis";
import stream from "stream";
import { env } from "../../../config/envManager.js";
import type { StorageDriver, UploadResult } from "../interface/storage-provider.interface.js";

/**
 * Driver Google Drive — upload/download/delete via l'API Drive v3.
 *
 * Réutilise la configuration OAuth2 existante (GOOGLE_CLIENT_ID, etc.).
 * Le `key` retourné est le `fileId` Google Drive.
 * Le `subDir` est interprété comme un `folderId` Drive cible (optionnel,
 * sinon le dossier par défaut GOOGLE_DRIVE_FOLDER_ID est utilisé).
 */
export class GoogleDriveStorageDriver implements StorageDriver {
  private drive: drive_v3.Drive;
  private folderId: string;
  private configured: boolean;

  constructor() {
    const clientId = env.get("GOOGLE_CLIENT_ID") as string | undefined;
    const clientSecret = env.get("GOOGLE_CLIENT_SECRET") as string | undefined;
    const redirectUri = env.get("GOOGLE_REDIRECT_URI") as string | undefined;
    const refreshToken = env.get("GOOGLE_REFRESH_TOKEN") as string | undefined;
    this.folderId = (env.get("GOOGLE_DRIVE_FOLDER_ID") as string | undefined) || "";

    this.configured = !!(clientId && clientSecret && refreshToken && this.folderId);

    if (!this.configured) {
      console.warn("[GoogleDriveDriver] Configuration incomplète. Le driver ne sera pas opérationnel.");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    if (refreshToken) {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
    }

    this.drive = google.drive({ version: "v3", auth: oauth2Client });
  }

  isConfigured(): boolean { return this.configured; }

  async uploadFile(buffer: Buffer, name: string, mimeType: string, subDir?: string): Promise<UploadResult> {
    if (!this.configured) {
      throw new Error("[GoogleDriveDriver] Driver non configuré.");
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    // subDir est interprété comme folderId Drive cible
    const targetFolderId = subDir || this.folderId;

    const fileMetadata = {
      name,
      parents: [targetFolderId],
    };

    const media = {
      mimeType,
      body: bufferStream,
    };

    const res = await this.drive.files.create(
      {
        requestBody: fileMetadata,
        media,
        fields: "id, name, webContentLink, webViewLink, size",
        supportsAllDrives: true,
        supportsTeamDrives: true,
      },
      {
        params: { uploadType: "resumable" },
      },
    );

    const fileId = res.data.id;
    if (!fileId) {
      throw new Error("[GoogleDriveDriver] Impossible de récupérer le fileId.");
    }

    // Rendre le fichier accessible en lecture publique
    await this.drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });

    const url = res.data.webContentLink || res.data.webViewLink || "";
    const size = res.data.size ? parseInt(res.data.size, 10) : buffer.length;

    return { url, size, key: fileId };
  }

  async getFile(key: string): Promise<Buffer> {
    if (!this.configured) {
      throw new Error("[GoogleDriveDriver] Driver non configuré.");
    }

    const res = await this.drive.files.get(
      { fileId: key, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    );

    return Buffer.from(res.data as ArrayBuffer);
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.configured) {
      return;
    }

    try {
      await this.drive.files.delete({
        fileId: key,
        supportsAllDrives: true,
      });
    } catch (err) {
      console.error(`[GoogleDriveDriver] Échec de suppression du fichier ${key}:`, err);
    }
  }
}
