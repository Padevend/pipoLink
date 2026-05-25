import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import type { AttachmentDownloadState, MessageAttachment } from '@/shared/api/types';
import { getStaticUri } from '@/shared/lib/static';
import * as FileSystem from 'expo-file-system/legacy';
import {
  decryptedFileExists,
  deleteAttachmentFiles,
  getEncryptedPath,
  initAttachmentCache
} from './attachment-cache.manager';
import { AttachmentQueue } from './attachment.queue';
import {
  deleteAttachmentDownload,
  getAttachmentDownload,
  getInterruptedDownloads,
  updateAttachmentProgress,
  updateAttachmentStatus,
  upsertAttachmentDownload,
} from './attachment.repository';
import { decryptAttachmentFile } from './encrypted-storage.service';

// ─── EVENT EMITTER (lightweight, no external dependency) ─────────────────────

type ManagerEventMap = {
  /** Fired whenever a download's state row changes (progress tick or status transition). */
  stateChange: AttachmentDownloadState;
};

type ManagerListener<K extends keyof ManagerEventMap> = (
  payload: ManagerEventMap[K],
) => void;

class AttachmentEventEmitter {
  private _listeners: Map<string, Set<Function>> = new Map();

  on<K extends keyof ManagerEventMap>(
    event: K,
    listener: ManagerListener<K>,
  ): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener);
    return () => this._listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof ManagerEventMap>(event: K, payload: ManagerEventMap[K]): void {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

// ─── INPUT TYPES ─────────────────────────────────────────────────────────────

export interface StartDownloadInput {
  /** Full attachment metadata from the message */
  attachment: MessageAttachment;
  /** Parent message ID (used to associate the download row) */
  messageId: string;
  /** Parent chat ID (needed to resolve the chat key for decryption) */
  chatId: string;
}

// ─── MANAGER CLASS ───────────────────────────────────────────────────────────

class AttachmentDownloadManager {
  private readonly _queue = new AttachmentQueue();
  private readonly _emitter = new AttachmentEventEmitter();

  /**
   * Map from attachment ID → active DownloadResumable instance.
   * Only populated while a download is in-flight (status = 'downloading').
   * Cleared on completion, failure, cancellation, or pause.
   */
  private readonly _resumables = new Map<string, FileSystem.DownloadResumable>();

  // ─── LIFECYCLE METHODS ─────────────────────────────────────────────────────

  /**
   * Call once at app startup (in your root layout or provider) to:
   *   1. Initialise the cache directory structure.
   *   2. Re-enqueue any downloads that were interrupted on last run.
   *
   * Downloads that were `paused` are NOT automatically resumed — the user must
   * explicitly tap Resume. Downloads that were `downloading` at shutdown
   * (i.e. forcefully killed) are marked `paused` so the user can resume them.
   */
  async initialize(): Promise<void> {
    await initAttachmentCache();

    const interrupted = getInterruptedDownloads();
    for (const state of interrupted) {
      if (state.status === 'downloading') {
        // The app was killed mid-download. Treat as paused so the user can resume.
        updateAttachmentStatus(state.id, 'paused');
        this._emitStateChange({ ...state, status: 'paused' });
      }
      // 'paused' rows are left as-is; 'queued' rows are re-enqueued below
      if (state.status === 'queued') {
        // Re-enqueue without re-fetching the chatKey (it's cached in secure store)
        this._enqueueJob(state);
      }
    }
  }

  // ─── PUBLIC API ────────────────────────────────────────────────────────────

  /**
   * Begins (or resumes) the download for a message attachment.
   *
   * Idempotent:
   *   - If the attachment is already `completed` and the decrypted file exists,
   *     this is a no-op. The caller should read from the cache directly.
   *   - If the attachment is already `downloading` or `queued`, this is a no-op.
   *   - If the attachment is `paused`, call `resume()` instead.
   *   - If the attachment is `failed` or `idle`, a new download is started.
   */
  async download({ attachment, messageId, chatId }: StartDownloadInput): Promise<void> {
    const existing = getAttachmentDownload(attachment.id);

    // Cache hit: already completed and decrypted file still exists on disk
    if (existing?.status === 'completed' && existing.decrypted_local_uri) {
      const stillExists = await decryptedFileExists(attachment.id, attachment.fileName);
      if (stillExists) {
        // Nothing to do — tell the UI to render from the cached path
        this._emitStateChange(existing);
        return;
      }
      // Cache was evicted — fall through to re-download
    }

    // Already in-flight or queued — do nothing
    if (
      existing &&
      (existing.status === 'downloading' ||
        existing.status === 'queued' ||
        existing.status === 'decrypting')
    ) {
      return;
    }

    // If paused, direct user to call resume()
    if (existing?.status === 'paused') {
      return;
    }

    // Create or reset the download row in SQLite
    const now = Date.now();
    const state: AttachmentDownloadState = {
      id: attachment.id,
      message_id: messageId,
      chat_id: chatId,
      encrypted_url: getStaticUri(attachment.fileUrl),
      filename: attachment.fileName,
      mime_type: attachment.mimeType,
      file_size: attachment.fileSize,
      iv: attachment.iv,
      status: 'queued',
      progress: 0,
      total_bytes: attachment.fileSize,
      written_bytes: 0,
      encrypted_local_uri: getEncryptedPath(attachment.id),
      decrypted_local_uri: null,
      resume_data: null,
      error_message: null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };

    upsertAttachmentDownload(state);
    this._emitStateChange(state);

    // Hand the job to the queue
    this._enqueueJob(state);
  }

  /**
   * Pauses an active download. The DownloadResumable's resume data is saved
   * to SQLite so the download can continue later from the byte offset it stopped.
   *
   * No-op if the attachment is not currently downloading.
   */
  async pause(attachmentId: string): Promise<void> {
    const resumable = this._resumables.get(attachmentId);
    if (!resumable) return;

    try {
      const pauseResult = await resumable.pauseAsync();
      this._resumables.delete(attachmentId);

      updateAttachmentStatus(attachmentId, 'paused', {
        resumeData: pauseResult?.resumeData ?? null,
      });

      const updated = getAttachmentDownload(attachmentId);
      if (updated) this._emitStateChange(updated);
    } catch (err) {
      console.warn(`[AttachmentDownloadManager] pause failed for ${attachmentId}:`, err);
    }
  }

  /**
   * Resumes a paused download from where it left off.
   * Re-creates a DownloadResumable from the `resume_data` stored in SQLite.
   *
   * No-op if the attachment is not paused or has no resume_data.
   */
  async resume(attachmentId: string): Promise<void> {
    const state = getAttachmentDownload(attachmentId);
    if (!state || state.status !== 'paused') return;

    // Mark as queued immediately so the UI updates
    updateAttachmentStatus(attachmentId, 'queued');
    this._emitStateChange({ ...state, status: 'queued' });

    // Re-enqueue with the existing row data
    this._enqueueJob(state);
  }

  /**
   * Cancels a download and deletes all local files associated with it.
   * The SQLite row is also deleted.
   */
  async cancel(attachmentId: string): Promise<void> {
    // Stop in-flight download if any
    const resumable = this._resumables.get(attachmentId);
    if (resumable) {
      try {
        await resumable.cancelAsync();
      } catch {
        // Best-effort
      }
      this._resumables.delete(attachmentId);
    }

    // Remove from waiting queue
    this._queue.dequeue(attachmentId);

    // Fetch state before deleting row (need filename for file cleanup)
    const state = getAttachmentDownload(attachmentId);

    // Clean up local files
    if (state) {
      await deleteAttachmentFiles(attachmentId, state.filename);
    }

    // Remove the row entirely
    deleteAttachmentDownload(attachmentId);

    // Emit a synthetic cancelled state so the UI resets to idle
    if (state) {
      this._emitStateChange({ ...state, status: 'cancelled' });
    }
  }

  /**
   * Subscribe to attachment state changes.
   * The listener is called with the full `AttachmentDownloadState` row whenever
   * the manager updates any attachment's status or progress.
   *
   * Returns an unsubscribe function — call it in your hook's cleanup / useEffect
   * return to prevent memory leaks.
   *
   * @example
   * const unsub = attachmentDownloadManager.on('stateChange', (s) => {
   *   if (s.id === myAttachmentId) setLocalState(s);
   * });
   * return () => unsub();
   */
  on<K extends keyof ManagerEventMap>(
    event: K,
    listener: ManagerListener<K>,
  ): () => void {
    return this._emitter.on(event, listener);
  }

  /**
   * Synchronously reads the current state for a given attachment.
   * Returns null if no download has been started for this ID.
   */
  getState(attachmentId: string): AttachmentDownloadState | null {
    return getAttachmentDownload(attachmentId);
  }

  // ─── PRIVATE IMPLEMENTATION ────────────────────────────────────────────────

  /**
   * Creates the async job function and submits it to the queue.
   * The job handles the full download → decrypt pipeline.
   */
  private _enqueueJob(state: AttachmentDownloadState): void {
    this._queue.enqueue({
      id: state.id,
      execute: () => this._runDownloadJob(state),
    });
  }

  /**
   * Core download + decrypt job. Runs inside the queue.
   *
   * Pipeline:
   *   1. Create DownloadResumable pointing at `encrypted_url` → `encrypted_local_uri`
   *   2. Stream download with progress callbacks → SQLite + emitter
   *   3. On complete: mark status=decrypting, fetch chatKey, call decryptAttachmentFile
   *   4. On success: mark status=completed, emit final state
   *   5. On any error: mark status=failed, emit error state
   */
  private async _runDownloadJob(state: AttachmentDownloadState): Promise<void> {
    const { id, encrypted_url, encrypted_local_uri, filename, iv, chat_id, resume_data } = state;

    // Transition to 'downloading'
    updateAttachmentStatus(id, 'downloading');
    this._emitStateChange({ ...state, status: 'downloading' });

    const encPath = encrypted_local_uri ?? getEncryptedPath(id);

    try {
      // ── STEP 1: Create DownloadResumable ────────────────────────────────────
      const resumable = FileSystem.createDownloadResumable(
        encrypted_url,
        encPath,
        {}, // No custom headers needed — signed URL has auth built-in
        (downloadProgress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
          const progress =
            totalBytesExpectedToWrite > 0
              ? totalBytesWritten / totalBytesExpectedToWrite
              : 0;

          // Update SQLite on every progress tick
          updateAttachmentProgress(
            id,
            progress,
            totalBytesWritten,
            totalBytesExpectedToWrite,
            'downloading',
          );

          // Emit throttled progress event (the emitter fires every tick;
          // the UI hook can throttle rendering via useMemo/useCallback)
          this._emitStateChange({
            ...state,
            status: 'downloading',
            progress,
            written_bytes: totalBytesWritten,
            total_bytes: totalBytesExpectedToWrite,
          });
        },
        resume_data ?? undefined, // Resume from byte offset if available
      );

      this._resumables.set(id, resumable);

      // ── STEP 2: Execute the download ─────────────────────────────────────────
      let result: FileSystem.FileSystemDownloadResult | undefined;

      if (resume_data) {
        result = await resumable.resumeAsync();
      } else {
        result = await resumable.downloadAsync();
      }

      this._resumables.delete(id);

      if (!result || result.status !== 200) {
        throw new Error(
          `Download returned HTTP ${result?.status ?? 'null'} for attachment ${id}. ` +
          `The signed URL may have expired — the user should retry to get a fresh URL.`,
        );
      }

      // ── STEP 3: Decrypt the downloaded .enc file ──────────────────────────────
      updateAttachmentStatus(id, 'decrypting', {
        encryptedLocalUri: encPath,
        progress: 1,
      });
      this._emitStateChange({
        ...state,
        status: 'decrypting',
        progress: 1,
        encrypted_local_uri: encPath,
      });

      // Fetch the chat key from secure store (cached by ensure-chat-key.ts)
      const chatKey = await ensureChatKeyForChat(chat_id);

      const { decryptedUri } = await decryptAttachmentFile({
        attachmentId: id,
        filename,
        iv,
        chatKey,
      });

      // ── STEP 4: Mark completed ────────────────────────────────────────────────
      updateAttachmentStatus(id, 'completed', {
        encryptedLocalUri: encPath,
        decryptedLocalUri: decryptedUri,
        progress: 1,
      });

      const finalState = getAttachmentDownload(id);
      if (finalState) this._emitStateChange(finalState);

      // Optionally delete the .enc file to save space (comment out if offline re-decrypt is needed)
      // await deleteEncryptedFile(id);
    } catch (err) {
      this._resumables.delete(id);

      const errorMsg = err instanceof Error ? err.message : String(err);
      updateAttachmentStatus(id, 'failed', { errorMessage: errorMsg });

      const failedState = getAttachmentDownload(id);
      if (failedState) this._emitStateChange(failedState);

      console.warn(`[AttachmentDownloadManager] Download failed for ${id}:`, errorMsg);
    }
  }

  /** Emits a stateChange event to all listeners. */
  private _emitStateChange(state: AttachmentDownloadState): void {
    this._emitter.emit('stateChange', state);
  }
}

// ─── SINGLETON EXPORT ─────────────────────────────────────────────────────────

/**
 * Global singleton instance.
 *
 * Import this wherever you need to trigger downloads or listen for state changes.
 * Call `attachmentDownloadManager.initialize()` once at app startup.
 */
export const attachmentDownloadManager = new AttachmentDownloadManager();
