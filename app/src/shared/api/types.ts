import { Conversation } from "./messaging";

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
export type UserRole = "student" | "staff" | "admin";

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
  profile?: UserProfile | null;
  converstions?: Conversation[];
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
export type MessageType = "TEXT" | "IMAGE" | "DOCUMENT" | "MIXED" | "SYSTEM";

/**
 * Message status
 */
export type MessageStatus = "send" | "delivered" | "read";

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
  id: string;
  fileUrl: string;
  iv: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export type AttachmentDownloadStatus =
  | "idle"
  | "queued"
  | "downloading"
  | "paused"
  | "decrypting"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * SQLite row for the `attachment_downloads` table.
 *
 * Persisted across app restarts so in-progress downloads can be resumed
 * and completed files can be served from cache without re-downloading.
 */
export interface AttachmentDownloadState {
  id: string;
  message_id: string;
  chat_id: string;
  encrypted_url: string;
  filename: string;
  mime_type: string;
  file_size: number;
  iv: string;
  status: AttachmentDownloadStatus;
  progress: number;
  total_bytes: number;
  written_bytes: number;
  encrypted_local_uri: string | null;
  decrypted_local_uri: string | null;
  resume_data: string | null;
  error_message: string | null;
  created_at: number;
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
  sender?: MessageSender;
  responseToId?: string | null;
  responseTo?: Message | null;
  is_deleted?: boolean;
}

export interface MessageSender {
  id: string;
  username: string;
  profile?: {
    avatarUrl: string | null;
  }
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
export type DocumentType =
  | "COURS"
  | "TD"
  | "TP"
  | "CC"
  | "EXAMEN"
  | "RESUME"
  | "AUTRE";

/**
 * Moderation status
 */
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  id: string;
  document_id: string;
  filename: string;
  remote_uri: string;
  local_uri: string;
  mineType?: string;
  progress: number;
  totalBytes: number;
  writtenBytes: number;
  status: DownloadStatus;
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
