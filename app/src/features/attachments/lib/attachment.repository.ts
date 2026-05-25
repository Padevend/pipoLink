/**
 * attachment.repository.ts
 *
 * SQLite CRUD layer for the `attachment_downloads` table.
 *
 * This is the single source of truth for attachment download state
 * persistence. All other modules (manager, hooks, UI) use this to read
 * and write download progress, status, and local file paths.
 *
 * Architecture note:
 *   - All writes go through `upsert()` to guarantee atomic updates.
 *   - All reads are synchronous (uses expo-sqlite `*Sync` variants) to
 *     avoid async waterfalls in the UI render path.
 *   - The repository does NOT emit events — callers (the download manager)
 *     are responsible for notifying the reactive store after writes.
 */

import type { AttachmentDownloadState, AttachmentDownloadStatus } from '@/shared/api/types';
import { db } from '@/shared/storage/sqlite';

// ─── WRITE OPERATIONS ────────────────────────────────────────────────────────

/**
 * Insert or replace a full attachment download row.
 * Use this when first registering a new download or restoring state on
 * app restart.
 */
export function upsertAttachmentDownload(state: AttachmentDownloadState): void {
  db.runSync(
    `INSERT OR REPLACE INTO attachment_downloads (
       id, message_id, chat_id, encrypted_url, filename, mime_type, file_size, iv,
       status, progress, total_bytes, written_bytes,
       encrypted_local_uri, decrypted_local_uri,
       resume_data, error_message, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      state.id,
      state.message_id,
      state.chat_id,
      state.encrypted_url,
      state.filename,
      state.mime_type,
      state.file_size,
      state.iv,
      state.status,
      state.progress,
      state.total_bytes,
      state.written_bytes,
      state.encrypted_local_uri ?? null,
      state.decrypted_local_uri ?? null,
      state.resume_data ?? null,
      state.error_message ?? null,
      state.created_at,
      state.updated_at,
    ],
  );
}

/**
 * Partial update — only modifies the columns that are relevant during an
 * active download tick. Avoids the overhead of a full row replacement on
 * every progress callback (which fires multiple times per second).
 */
export function updateAttachmentProgress(
  id: string,
  progress: number,
  writtenBytes: number,
  totalBytes: number,
  status: AttachmentDownloadStatus = 'downloading',
): void {
  db.runSync(
    `UPDATE attachment_downloads
     SET progress = ?, written_bytes = ?, total_bytes = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [progress, writtenBytes, totalBytes, status, Date.now(), id],
  );
}

/**
 * Update only the status field and optional supplementary data.
 * Used for transitions like: queued → downloading, decrypting → completed, etc.
 */
export function updateAttachmentStatus(
  id: string,
  status: AttachmentDownloadStatus,
  extras?: {
    encryptedLocalUri?: string | null;
    decryptedLocalUri?: string | null;
    resumeData?: string | null;
    errorMessage?: string | null;
    progress?: number;
  },
): void {
  db.runSync(
    `UPDATE attachment_downloads
     SET status = ?,
         encrypted_local_uri = COALESCE(?, encrypted_local_uri),
         decrypted_local_uri = COALESCE(?, decrypted_local_uri),
         resume_data = ?,
         error_message = ?,
         progress = COALESCE(?, progress),
         updated_at = ?
     WHERE id = ?`,
    [
      status,
      extras?.encryptedLocalUri ?? null,
      extras?.decryptedLocalUri ?? null,
      extras?.resumeData ?? null,
      extras?.errorMessage ?? null,
      extras?.progress ?? null,
      Date.now(),
      id,
    ],
  );
}

/** Hard-delete a row (used after cancel + file cleanup). */
export function deleteAttachmentDownload(id: string): void {
  db.runSync(`DELETE FROM attachment_downloads WHERE id = ?`, [id]);
}

// ─── READ OPERATIONS ─────────────────────────────────────────────────────────

/** Fetch a single attachment download row by its ID. Returns null if not found. */
export function getAttachmentDownload(id: string): AttachmentDownloadState | null {
  const row = db.getFirstSync<AttachmentDownloadState>(
    `SELECT * FROM attachment_downloads WHERE id = ?`,
    [id],
  );
  return row ?? null;
}

/** Fetch all attachment downloads for a given chat. */
export function getAttachmentDownloadsByChat(chatId: string): AttachmentDownloadState[] {
  return db.getAllSync<AttachmentDownloadState>(
    `SELECT * FROM attachment_downloads WHERE chat_id = ? ORDER BY created_at ASC`,
    [chatId],
  );
}

/**
 * Fetch all downloads that were interrupted (status = 'downloading' or 'queued')
 * when the app was last closed. Called on app startup to restore in-progress work.
 */
export function getInterruptedDownloads(): AttachmentDownloadState[] {
  return db.getAllSync<AttachmentDownloadState>(
    `SELECT * FROM attachment_downloads
     WHERE status IN ('downloading', 'queued', 'paused')
     ORDER BY created_at ASC`,
  );
}

/**
 * Check if a completed, valid decrypted file exists for this attachment.
 * Returns the decrypted_local_uri if the download is completed, null otherwise.
 */
export function getCompletedDecryptedUri(attachmentId: string): string | null {
  const row = db.getFirstSync<{ decrypted_local_uri: string | null }>(
    `SELECT decrypted_local_uri FROM attachment_downloads
     WHERE id = ? AND status = 'completed' AND decrypted_local_uri IS NOT NULL`,
    [attachmentId],
  );
  return row?.decrypted_local_uri ?? null;
}
