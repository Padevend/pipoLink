/**
 * attachment-cache.manager.ts
 *
 * Manages the local cache directory structure for chat attachments.
 *
 * Cache layout:
 *   <cacheDirectory>/attachments/
 *     encrypted/   ← raw .enc files downloaded from CDN
 *     decrypted/   ← decrypted ready-to-view files
 *     previews/    ← (future) thumbnail/preview images
 *
 * Design decisions:
 *   - Encrypted files are kept alongside decrypted ones because signed CDN
 *     URLs can expire. If a user needs to re-view an attachment when offline,
 *     we can re-decrypt from the local .enc file without hitting the network.
 *   - Decrypted files use the extension derived from the mimeType to ensure
 *     the OS correctly identifies and opens the file.
 *   - The previews directory is reserved for future thumbnail generation.
 */

import * as FileSystem from 'expo-file-system/legacy';

// ─── DIRECTORY PATHS ─────────────────────────────────────────────────────────

const CACHE_ROOT = `${FileSystem.cacheDirectory}attachments/`;
const ENCRYPTED_DIR = `${CACHE_ROOT}encrypted/`;
const DECRYPTED_DIR = `${CACHE_ROOT}decrypted/`;
const PREVIEWS_DIR = `${CACHE_ROOT}previews/`;

// ─── INITIALISATION ──────────────────────────────────────────────────────────

let _initialized = false;

/**
 * Creates the cache directory structure if it doesn't already exist.
 * Must be called once at app startup (e.g. from the root layout or provider).
 * Safe to call multiple times — uses `intermediates: true`.
 */
export async function initAttachmentCache(): Promise<void> {
  if (_initialized) return;
  await FileSystem.makeDirectoryAsync(ENCRYPTED_DIR, { intermediates: true });
  await FileSystem.makeDirectoryAsync(DECRYPTED_DIR, { intermediates: true });
  await FileSystem.makeDirectoryAsync(PREVIEWS_DIR, { intermediates: true });
  _initialized = true;
}

// ─── PATH RESOLUTION ─────────────────────────────────────────────────────────

/**
 * Returns the absolute local path where the encrypted `.enc` file will be
 * stored during download. The file is named by attachment ID to avoid
 * collisions across chats.
 *
 * Example: .../attachments/encrypted/abc123.enc
 */
export function getEncryptedPath(attachmentId: string): string {
  return `${ENCRYPTED_DIR}${attachmentId}.enc`;
}

/**
 * Returns the absolute local path for the decrypted output file.
 * The extension is derived from the original filename to preserve
 * OS-level file type associations.
 *
 * Example: .../attachments/decrypted/abc123.jpg
 */
export function getDecryptedPath(attachmentId: string, filename: string): string {
  const ext = extractExtension(filename);
  return `${DECRYPTED_DIR}${attachmentId}${ext ? `.${ext}` : ''}`;
}

/**
 * Returns the path for a preview/thumbnail image.
 * Reserved for future use.
 */
export function getPreviewPath(attachmentId: string): string {
  return `${PREVIEWS_DIR}${attachmentId}_thumb.jpg`;
}

// ─── FILE EXISTENCE CHECKS ───────────────────────────────────────────────────

/**
 * Checks whether the encrypted .enc file exists on disk.
 * This is used to determine if a download was interrupted (file partial)
 * or fully downloaded.
 */
export async function encryptedFileExists(attachmentId: string): Promise<boolean> {
  const path = getEncryptedPath(attachmentId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

/**
 * Checks whether the decrypted file exists and has non-zero size.
 * Used as a cache hit check before decrypting again.
 */
export async function decryptedFileExists(
  attachmentId: string,
  filename: string,
): Promise<boolean> {
  const path = getDecryptedPath(attachmentId, filename);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return false;
  // Guard against zero-byte files left by a failed write
  return (info as FileSystem.FileInfo & { size?: number }).size !== 0;
}

// ─── CLEANUP ─────────────────────────────────────────────────────────────────

/**
 * Deletes the encrypted file for a given attachment.
 * Called after successful decryption (optional — we keep it for offline
 * re-decryption) or after cancellation.
 */
export async function deleteEncryptedFile(attachmentId: string): Promise<void> {
  const path = getEncryptedPath(attachmentId);
  await FileSystem.deleteAsync(path, { idempotent: true });
}

/**
 * Deletes both encrypted and decrypted files for an attachment.
 * Called when the user explicitly evicts a cached attachment.
 */
export async function deleteAttachmentFiles(
  attachmentId: string,
  filename: string,
): Promise<void> {
  await Promise.all([
    FileSystem.deleteAsync(getEncryptedPath(attachmentId), { idempotent: true }),
    FileSystem.deleteAsync(getDecryptedPath(attachmentId, filename), { idempotent: true }),
    FileSystem.deleteAsync(getPreviewPath(attachmentId), { idempotent: true }),
  ]);
}

/**
 * Purges all attachment cache directories.
 * Only for user-facing "Clear Cache" setting.
 */
export async function purgeAttachmentCache(): Promise<void> {
  await FileSystem.deleteAsync(CACHE_ROOT, { idempotent: true });
  _initialized = false;
  await initAttachmentCache();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Extracts the file extension from a filename, e.g. "photo.jpg" → "jpg". */
function extractExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return (parts.at(-1) ?? '').toLowerCase();
}
