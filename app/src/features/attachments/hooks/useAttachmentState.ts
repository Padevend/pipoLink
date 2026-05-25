/**
 * useAttachmentState.ts
 *
 * Reactive hook that subscribes to a single attachment's download state.
 *
 * This hook is the bridge between the global `AttachmentDownloadManager` and
 * the React component tree. It:
 *   1. Reads the initial state from SQLite synchronously on mount.
 *   2. Subscribes to the manager's `stateChange` events.
 *   3. Filters incoming events to only those matching the requested `attachmentId`.
 *   4. Returns the current `AttachmentDownloadState` (or null if no download
 *      has been started).
 *
 * Design decisions:
 *   - The hook does NOT trigger downloads — that is `useAttachmentDownload`'s job.
 *   - The hook stores state locally via `useState` so it integrates naturally
 *     with React's render lifecycle.
 *   - `useCallback` guards the listener to prevent stale-closure issues with
 *     the emitter subscription.
 *   - The hook unmounts cleanly by calling the unsubscribe function returned
 *     by `attachmentDownloadManager.on()`.
 */

import type { AttachmentDownloadState } from '@/shared/api/types';
import { useCallback, useEffect, useState } from 'react';
import { attachmentDownloadManager } from '../lib/attachment-download.manager';

/**
 * Returns the current `AttachmentDownloadState` for a given attachment ID.
 *
 * The state updates automatically as the download progresses, is paused,
 * fails, or completes. Returns `null` if no download has ever been started
 * for this attachment (status is effectively 'idle').
 *
 * @param attachmentId - The `MessageAttachment.id` to observe.
 *
 * @example
 * const state = useAttachmentState('att-123');
 * if (!state || state.status === 'idle') return <DownloadButton />;
 * if (state.status === 'completed') return <Image uri={state.decrypted_local_uri} />;
 */
export function useAttachmentState(attachmentId: string): AttachmentDownloadState | null {
  // Read initial state synchronously from SQLite (no async flash)
  const [state, setState] = useState<AttachmentDownloadState | null>(() =>
    attachmentDownloadManager.getState(attachmentId),
  );

  const handleStateChange = useCallback(
    (incoming: AttachmentDownloadState) => {
      // Only process events for THIS attachment to avoid unnecessary re-renders
      if (incoming.id !== attachmentId) return;

      // Cancelled rows are deleted from SQLite — reset to null (idle)
      if (incoming.status === 'cancelled') {
        setState(null);
        return;
      }

      setState(incoming);
    },
    [attachmentId],
  );

  useEffect(() => {
    // Re-read from SQLite in case state changed while the component was unmounted
    // (e.g. user navigated away mid-download and came back)
    const current = attachmentDownloadManager.getState(attachmentId);
    setState(current);

    // Subscribe to future changes
    const unsubscribe = attachmentDownloadManager.on('stateChange', handleStateChange);
    return unsubscribe;
  }, [attachmentId, handleStateChange]);

  return state;
}
