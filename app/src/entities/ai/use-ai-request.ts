import { useCallback, useSyncExternalStore } from 'react';
import { AiRequestManager } from './ai-request-manager';

/**
 * React hook that connects a component to the AiRequestManager singleton.
 *
 * Provides:
 * - `sendMessage(sessionId, message)` — fire-and-forget
 * - `generateStudyAid(sessionId, type)` — fire-and-forget
 * - `isPending` — whether there's an active/queued request for this session
 * - `isGloballyPending` — whether any AI request is in flight
 * - `queueLength` — total items being processed + queued
 * - `abortCurrent()` — cancel the current in-flight request
 */
export function useAiRequest(sessionId?: string) {
  // Subscribe to manager state via useSyncExternalStore
  const state = useSyncExternalStore(
    subscribeToManager,
    () => AiRequestManager.getState(),
    () => AiRequestManager.getState()
  );

  const isPending = sessionId
    ? AiRequestManager.isPending(sessionId)
    : false;

  const isGloballyPending =
    state.currentRequest !== null || state.queue.length > 0;

  const queueLength = AiRequestManager.getQueueLength();

  const sendMessage = useCallback(
    (message: string, targetSessionId?: string) => {
      const sid = targetSessionId ?? sessionId;
      if (!sid) {
        console.warn('[useAiRequest] No sessionId provided');
        return;
      }
      AiRequestManager.sendMessage(sid, message);
    },
    [sessionId]
  );

  const generateStudyAid = useCallback(
    (type: string, targetSessionId?: string) => {
      const sid = targetSessionId ?? sessionId;
      if (!sid) {
        console.warn('[useAiRequest] No sessionId provided');
        return;
      }
      AiRequestManager.generateStudyAid(sid, type);
    },
    [sessionId]
  );

  const abortCurrent = useCallback(() => {
    AiRequestManager.abortCurrent();
  }, []);

  return {
    sendMessage,
    generateStudyAid,
    isPending,
    isGloballyPending,
    queueLength,
    abortCurrent,
    currentRequest: state.currentRequest,
  };
}

// ── Subscription helper for useSyncExternalStore ──────────────────────────

let snapshotVersion = 0;

function subscribeToManager(onStoreChange: () => void): () => void {
  const unsub = AiRequestManager.on('queue-updated', () => {
    snapshotVersion++;
    onStoreChange();
  });
  return unsub;
}
