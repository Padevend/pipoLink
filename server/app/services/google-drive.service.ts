import { google, drive_v3 } from "googleapis";
import { env } from "../../config/envManager.js";
import stream from "stream";
import path from "path";

export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private folderId: string;

  constructor() {
    const credsPath = env.get("GOOGLE_DRIVE_CREDENTIALS_PATH") as string | undefined;
    this.folderId = env.get("GOOGLE_DRIVE_FOLDER_ID") as string | undefined || "";

    if (!credsPath || !this.folderId) {
      console.warn("Google Drive configuration missing. Files will not be uploaded to Drive.");
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: credsPath ? path.resolve(process.cwd(), credsPath) : undefined,
      scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
    });

    this.drive = google.drive({ version: "v3", auth });
  }

  public get isConfigured(): boolean {
    return !!env.get("GOOGLE_DRIVE_CREDENTIALS_PATH") && !!env.get("GOOGLE_DRIVE_FOLDER_ID");
  }

  /**
   * Upload a file buffer to Google Drive
   */
  async uploadFile(buffer: Buffer, fileName: string, mimeType: string, targetFolderId?: string): Promise<{ url: string; size: number, fileId: string }> {
    if (!this.isConfigured) {
      throw new Error("Google Drive is not configured.");
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const fileMetadata = {
      name: fileName,
      parents: [targetFolderId || this.folderId],
    };

    const media = {
      mimeType,
      body: bufferStream,
    };

    // Upload to Drive
    const res = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, webContentLink, webViewLink, size",
      supportsAllDrives: true,
      supportsTeamDrives: true,
    });

    const fileId = res.data.id;
    if (!fileId) {
      throw new Error("Failed to retrieve file ID from Google Drive.");
    }

    // Set permission to anyone with link can view/download
    await this.drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    });

    // We can query again to ensure webContentLink is generated, but creating permissions usually exposes it.
    // If not present, fallback to webViewLink
    const url = res.data.webContentLink || res.data.webViewLink || "";
    const size = res.data.size ? parseInt(res.data.size, 10) : buffer.length;

    return { url, size, fileId };
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    
    try {
      await this.drive.files.delete({
        fileId: fileId,
        supportsAllDrives: true,
      });
    } catch (err) {
      console.error(`Failed to delete file ${fileId} from Google Drive:`, err);
    }
  }
}
