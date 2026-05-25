import { decryptFile } from '@/shared/crypto/document';
import naclUtil from 'tweetnacl-util';
import * as FileSystem from 'expo-file-system/legacy';
import { getDecryptedPath, getEncryptedPath } from './attachment-cache.manager';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface DecryptAttachmentParams {
  attachmentId: string;
  /** Original filename (used to derive output extension) */
  filename: string;
  /** Base64-encoded AES-GCM IV (12 bytes, as encoded by the server) */
  iv: string;
  /** 32-byte raw AES-256 chat key from expo-secure-store */
  chatKey: Uint8Array;
}

export interface DecryptAttachmentResult {
  /** Absolute path to the written decrypted file */
  decryptedUri: string;
}

// ─── MAIN DECRYPT FUNCTION ───────────────────────────────────────────────────

/**
 * Reads the `.enc` file from disk, decrypts it, and writes the result to the
 * decrypted cache directory. Returns the path to the decrypted file.
 *
 * Throws if:
 *   - The encrypted file does not exist (download was never completed or was deleted)
 *   - The decryption fails (invalid key, corrupted ciphertext, bad IV)
 *   - The write to the decrypted directory fails
 */
export async function decryptAttachmentFile({
  attachmentId,
  filename,
  iv,
  chatKey,
}: DecryptAttachmentParams): Promise<DecryptAttachmentResult> {
  const encryptedUri = getEncryptedPath(attachmentId);
  const decryptedUri = getDecryptedPath(attachmentId, filename);

  // Step 1: Read the encrypted file from disk as base64
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(encryptedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    throw new Error(
      `[encrypted-storage] Failed to read encrypted file at ${encryptedUri}: ${String(err)}`,
    );
  }

  // Step 2: Convert base64 → Uint8Array using naclUtil (avoids btoa RangeError on large files)
  const encryptedBuffer = naclUtil.decodeBase64(base64);

  // Step 3: Decrypt with existing crypto/document.ts — preserves all existing crypto logic
  const decryptedBuffer = await decryptFile(encryptedBuffer, iv, chatKey);

  if (!decryptedBuffer || decryptedBuffer.length === 0) {
    throw new Error(
      `[encrypted-storage] Decryption returned empty buffer for attachment ${attachmentId}. ` +
      `Check that the chat key and IV are correct.`,
    );
  }

  // Step 4: Write decrypted bytes to the decrypted cache directory
  // naclUtil.encodeBase64 is safe for large Uint8Arrays (no btoa RangeError)
  try {
    await FileSystem.writeAsStringAsync(
      decryptedUri,
      naclUtil.encodeBase64(decryptedBuffer),
      { encoding: FileSystem.EncodingType.Base64 },
    );
  } catch (err) {
    throw new Error(
      `[encrypted-storage] Failed to write decrypted file to ${decryptedUri}: ${String(err)}`,
    );
  }

  return { decryptedUri };
}
