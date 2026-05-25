/**
 * useAttachmentDownload.ts
 *
 * Compound hook that combines state observation (useAttachmentState) with
 * action dispatching (download, pause, resume, cancel, open).
 *
 * This is the primary hook for attachment UI components. It provides:
 *   - `state`     — current `AttachmentDownloadState | null` (null = idle)
 *   - `status`    — derived string for quick switch/match in the UI
 *   - `progress`  — 0.0 → 1.0 for the circular progress indicator
 *   - `isImage`   — whether the attachment is an image MIME type
 *   - `download`  — starts or re-triggers the download
 *   - `pause`     — pauses an active download
 *   - `resume`    — resumes a paused download
 *   - `cancel`    — cancels and cleans up
 *   - `openFile`  — opens the decrypted file with the OS viewer
 *
 * Usage:
 *   const { status, progress, download, openFile } = useAttachmentDownload({
 *     attachment,
 *     messageId,
 *     chatId,
 *   });
 */

import type { MessageAttachment } from '@/shared/api/types';
import * as Linking from 'expo-linking';
import { useCallback } from 'react';
import { attachmentDownloadManager } from '../lib/attachment-download.manager';
import { useAttachmentState } from './useAttachmentState';

// ─── INPUT ────────────────────────────────────────────────────────────────────

export interface UseAttachmentDownloadInput {
  /** Full attachment metadata from the message */
  attachment: MessageAttachment;
  /** Parent message ID */
  messageId: string;
  /** Parent chat ID — needed to resolve the chat key */
  chatId: string;
}

// ─── OUTPUT ───────────────────────────────────────────────────────────────────

export interface UseAttachmentDownloadResult {
  /**
   * Full download state from SQLite. Null means no download has been started
   * (equivalent to 'idle').
   */
  state: ReturnType<typeof useAttachmentState>;

  /**
   * Derived status string. Always defined — defaults to 'idle' when state is null.
   */
  status:
    | 'idle'
    | 'queued'
    | 'downloading'
    | 'paused'
    | 'decrypting'
    | 'completed'
    | 'failed'
    | 'cancelled';

  /** Download progress 0.0 → 1.0. 0 when idle, 1 when completed. */
  progress: number;

  /** True if the attachment MIME type is an image (e.g. image/jpeg, image/png). */
  isImage: boolean;

  /** True if the attachment MIME type is a video. */
  isVideo: boolean;

  /**
   * URI of the decrypted local file. Only set when status === 'completed'.
   * Pass this directly to <Image source={{ uri }} /> or Linking.openURL().
   */
  decryptedUri: string | null;

  /** Starts the download. No-op if already downloading/completed. */
  download: () => Promise<void>;

  /** Pauses an active download. */
  pause: () => Promise<void>;

  /** Resumes a paused download. */
  resume: () => Promise<void>;

  /** Cancels and cleans up local files. */
  cancel: () => Promise<void>;

  /**
   * Opens the decrypted file with the OS default viewer.
   * No-op if the file is not yet downloaded (status !== 'completed').
   */
  openFile: () => Promise<void>;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useAttachmentDownload({
  attachment,
  messageId,
  chatId,
}: UseAttachmentDownloadInput): UseAttachmentDownloadResult {
  const state = useAttachmentState(attachment.id);

  // Derive status with a safe fallback to 'idle'
  const status = state?.status ?? 'idle';
  const progress = state?.progress ?? 0;
  const decryptedUri = state?.decrypted_local_uri ?? null;

  // MIME-type helpers for rendering decisions in child components
  const isImage = attachment.mimeType.startsWith('image/');
  const isVideo = attachment.mimeType.startsWith('video/');

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  const download = useCallback(async () => {
    await attachmentDownloadManager.download({
      attachment,
      messageId,
      chatId,
    });
  }, [attachment, messageId, chatId]);

  const pause = useCallback(async () => {
    await attachmentDownloadManager.pause(attachment.id);
  }, [attachment.id]);

  const resume = useCallback(async () => {
    await attachmentDownloadManager.resume(attachment.id);
  }, [attachment.id]);

  const cancel = useCallback(async () => {
    await attachmentDownloadManager.cancel(attachment.id);
  }, [attachment.id]);

  const openFile = useCallback(async () => {
    if (status !== 'completed' || !decryptedUri) return;
    try {
      const canOpen = await Linking.canOpenURL(decryptedUri);
      if (canOpen) {
        await Linking.openURL(decryptedUri);
      }
    } catch (err) {
      console.warn('[useAttachmentDownload] openFile failed:', err);
    }
  }, [status, decryptedUri]);

  return {
    state,
    status,
    progress,
    isImage,
    isVideo,
    decryptedUri,
    download,
    pause,
    resume,
    cancel,
    openFile,
  };
}
