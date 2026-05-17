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

export interface MessageAttachment {
  id: string;
  fileUrl: string;
  iv: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
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
 * Document types
 */
export type DocumentType = 'COURS' | 'TD' | 'TP' | 'CC' | 'EXAMEN' | 'RESUME' | 'AUTRE';

/**
 * Moderation status
 */
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

/**
 * Auth types
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
