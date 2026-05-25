/**
 * Core API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * API error response
 */
export interface ErrorResponse {
  success: boolean;
  error: string;
  message: string;
  details?: any;
  meta?: {
    timestamp: string;
  };
}

/**
 * User roles
 */
export type UserRole = 'student' | 'staff' | 'admin';

/**
 * User object
 */
export interface User {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  is_active: boolean;
  is_configured: boolean;
}

/**
 * User profile details
 */
export interface UserProfile {
  firstname: string;
  lastname: string;
  phone: string | null;
  gender: string | null;
  niveau: string | null;
  filiere: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

/**
 * Message types
 */
export type MessageType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'MIXED' | 'SYSTEM';

/**
 * Message status
 */
export type MessageStatus = 'send' | 'delivered' | 'read';

/**
 * Attachment metadata received from the server.
 *
 * This is a lightweight descriptor — it contains NO local paths, NO download state,
 * and NO decrypted content. Attachments are lazy-loaded on user demand.
 *
 * Lifecycle: server sends this in message payload → stored as JSON in SQLite messages
 * table → rendered as placeholder UI until user taps download.
 */
export interface MessageAttachment {
  /** Unique server-assigned attachment ID */
  id: string;
  /** Signed URL pointing to the encrypted `.enc` file on the CDN */
  fileUrl: string;
  /** Base64-encoded AES-GCM IV used to decrypt this file */
  iv: string;
  /** Original filename (before encryption), e.g. "photo.jpg" */
  fileName: string;
  /** File size in bytes of the ORIGINAL (pre-encryption) file */
  fileSize: number;
  /** MIME type of the original file, e.g. "image/jpeg" */
  mimeType: string;
}

/**
 * Attachment download lifecycle state machine.
 *
 * State transitions:
 *   idle → queued → downloading → decrypting → completed
 *                      ↓ (pause)    ↑ (resume)
 *                   paused ─────────┘
 *                → failed   (on network/decrypt error, retryable)
 *                → cancelled (user-initiated)
 */
export type AttachmentDownloadStatus =
  | 'idle'         // Not yet requested by user
  | 'queued'       // In download queue, waiting for an open slot
  | 'downloading'  // Actively downloading the .enc file
  | 'paused'       // Download paused by user (resume_data stored in SQLite)
  | 'decrypting'   // .enc file downloaded, decryption in progress
  | 'completed'    // Decrypted file written to cache/decrypted/
  | 'failed'       // Error during download or decryption (retryable)
  | 'cancelled';   // User cancelled, local .enc file deleted

/**
 * SQLite row for the `attachment_downloads` table.
 *
 * Persisted across app restarts so in-progress downloads can be resumed
 * and completed files can be served from cache without re-downloading.
 */
export interface AttachmentDownloadState {
  /** Attachment ID — primary key, matches `MessageAttachment.id` */
  id: string;
  /** Parent message ID */
  message_id: string;
  /** Parent conversation/chat ID */
  chat_id: string;
  /** Remote CDN URL to the encrypted file */
  encrypted_url: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mime_type: string;
  /** File size in bytes of the original file */
  file_size: number;
  /** Base64 AES-GCM IV */
  iv: string;
  /** Current download/decrypt lifecycle status */
  status: AttachmentDownloadStatus;
  /** Download progress from 0.0 to 1.0 */
  progress: number;
  /** Total expected bytes */
  total_bytes: number;
  /** Bytes written so far */
  written_bytes: number;
  /** Absolute path to the encrypted .enc file in cache/attachments/encrypted/ */
  encrypted_local_uri: string | null;
  /** Absolute path to the decrypted file in cache/attachments/decrypted/ */
  decrypted_local_uri: string | null;
  /** JSON blob for DownloadResumable.savable(), null if not paused */
  resume_data: string | null;
  /** Human-readable error description for the failed state */
  error_message: string | null;
  /** Unix timestamp (ms) when the row was created */
  created_at: number;
  /** Unix timestamp (ms) of last status/progress update */
  updated_at: number;
}

/**
 * Message object (E2E encrypted content)
 */
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  cipherText: string;
  iv: string;
  status: MessageStatus;
  type: MessageType;
  created_at: string;
  attachments?: MessageAttachment[];
}

/**
 * @deprecated Use `AttachmentDownloadState` instead.
 * Kept temporarily to avoid breaking `local-db.ts` during migration.
 */
export interface LocalMessageAttachementsProps {
  id: string;
  encryptedUrl: string;
  decryptedLocalUri: string;
  filename: string;
  mimeType: string;
}

/**
 * Document types
 */
export type DocumentType = 'COURS' | 'TD' | 'TP' | 'CC' | 'EXAMEN' | 'RESUME' | 'AUTRE';

/**
 * Moderation status
 */
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DownloadStatus = 
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export interface DocumentUploader {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Library Document
 */
export interface Document {
  id: string;
  title: string;
  description: string | null;
  niveau: string | null;
  filiere: string | null;
  ue: string | null;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  moderationStatus: ModerationStatus;
  folderId: string | null;
  uploadedById: string;
  uploadedBy: DocumentUploader;
  createdAt: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  parentId: string | null;
  subfolderCount: number;
  documentCount: number;
}

export interface LibraryBrowseResult {
  folders: LibraryFolder[];
  documents: Document[];
  currentFolderId: string | null;
}

export interface getPopularDocumentsResponse {
  documents: Document[];
}

export interface downloadTask {
  id: string,
  document_id: string,
  filename: string,
  remote_uri: string,
  local_uri: string,
  mineType?: string,
  progress: number,
  totalBytes: number,
  writtenBytes: number,
  status: DownloadStatus,
  created_at: number;
  updated_at: number;
  resume_data?: string | null;
}

/**
 * Auth types
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
