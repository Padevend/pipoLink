import { google, drive_v3 } from "googleapis";
import { env } from "../../config/envManager.js";
import stream from "stream";

export class GoogleDriveService {
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
      console.warn("Google Drive configuration missing. Files will not be uploaded to Drive.");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    if (refreshToken) {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
    }

    this.drive = google.drive({ version: "v3", auth: oauth2Client });
  }

  public get isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Upload a file buffer to Google Drive
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    targetFolderId?: string
  ): Promise<{ url: string; size: number; fileId: string }> {
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

    const res = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, webContentLink, webViewLink, size",
      supportsAllDrives: true,
      supportsTeamDrives: true,
    }, {
      params: {
        uploadType: "resumable"
      }
    });

    const fileId = res.data.id;
    if (!fileId) {
      throw new Error("Failed to retrieve file ID from Google Drive.");
    }

    await this.drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    });

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