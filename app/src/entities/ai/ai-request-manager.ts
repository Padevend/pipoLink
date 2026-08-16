import { aiApi } from '@/shared/api/ai';
import type { AiChatMessage } from '@/shared/api/ai';
import { queryClient } from '@/providers';
import { aiKeys } from './hooks';
import { localDb } from '@/shared/storage/local-db';
import { generateUUID } from '@/shared/utils/uuid';
import { mergeAiMessages } from './message-order';

// ── Types ──────────────────────────────────────────────────────────────────

export type AiRequestType = 'chat' | 'study-aid';

export interface AiQueueItem {
  id: string;
  sessionId: string;
  type: AiRequestType;
  payload: { message?: string; studyAidType?: string };
  tempId?: string;
}

export type AiManagerEvent =
  | 'queue-updated'
  | 'request-started'
  | 'response-ready'
  | 'request-error';

export interface AiManagerState {
  currentRequest: AiQueueItem | null;
  queue: AiQueueItem[];
}

export interface AiResponseReadyPayload {
  sessionId: string;
  type: AiRequestType;
}

export interface AiRequestErrorPayload {
  sessionId: string;
  type: AiRequestType;
  error: unknown;
}

// ── Singleton ──────────────────────────────────────────────────────────────

type Listener = (data: any) => void;

class AiRequestManagerImpl {
  private _queue: AiQueueItem[] = [];
  private _current: AiQueueItem | null = null;
  private _abortController: AbortController | null = null;
  private _listeners = new Map<AiManagerEvent, Set<Listener>>();
  private _processing = false;
  private _clientOrder = 0;
  /** Cached snapshot — rebuilt only when the queue actually changes. */
  private _cachedState: AiManagerState | null = null;

  // ── Event system ────────────────────────────────────────────────────────

  on(event: AiManagerEvent, fn: Listener) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  off(event: AiManagerEvent, fn: Listener) {
    this._listeners.get(event)?.delete(fn);
  }

  private emit(event: AiManagerEvent, data?: any) {
    // Invalidate the cached snapshot whenever the queue state changes
    if (event === 'queue-updated') {
      this._cachedState = null;
    }
    this._listeners.get(event)?.forEach((fn) => {
      try { fn(data); } catch (e) { console.warn(`[AiManager] listener error (${event}):`, e); }
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────

  sendMessage(sessionId: string, message: string) {
    const tempId = `temp-${generateUUID()}`;

    // Optimistic update: add user message to cache immediately
    queryClient.setQueryData(aiKeys.history(sessionId), (old: any) => {
      const existing = old || [];
      return [
        ...existing,
        {
          id: tempId,
          role: 'user',
          content: message,
          status: 'send',
          createdAt: new Date().toISOString(),
          clientOrder: ++this._clientOrder,
        },
      ];
    });

    this.enqueue({
      sessionId,
      type: 'chat',
      payload: { message },
      tempId,
    });
  }

  generateStudyAid(sessionId: string, studyAidType: string) {
    this.enqueue({
      sessionId,
      type: 'study-aid',
      payload: { studyAidType },
    });
  }

  /** Abort the current in-flight request (does NOT clear the queue). */
  abortCurrent() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  /** Clear entire queue and abort current request. */
  clearAll() {
    this._queue = [];
    this.abortCurrent();
    this._current = null;
    this._processing = false;
    this.emit('queue-updated', this.getState());
  }

  /** Is there an active or queued request for the given session (or any session if omitted)? */
  isPending(sessionId?: string): boolean {
    if (!sessionId) return this._current !== null || this._queue.length > 0;
    return (
      this._current?.sessionId === sessionId ||
      this._queue.some((q) => q.sessionId === sessionId)
    );
  }

  /** Get the current processing item (if any). */
  getCurrentRequest(): AiQueueItem | null {
    return this._current;
  }

  getState(): AiManagerState {
    if (!this._cachedState) {
      this._cachedState = {
        currentRequest: this._current,
        queue: [...this._queue],
      };
    }
    return this._cachedState;
  }

  getQueueLength(): number {
    return this._queue.length + (this._current ? 1 : 0);
  }

  /** Remove a failed optimistic message from cache and local DB. */
  deleteFailedMessage(sessionId: string, messageId: string) {
    queryClient.setQueryData(aiKeys.history(sessionId), (old: any) => {
      const existing = old || [];
      return existing.filter((m: any) => m.id !== messageId);
    });
    localDb.deleteAiMessage(messageId);
  }

  /** Delete a failed message and re-enqueue it for processing. */
  retryFailedMessage(sessionId: string, msg: { id: string; content: string }) {
    this.deleteFailedMessage(sessionId, msg.id);
    this.sendMessage(sessionId, msg.content);
  }

  // ── Queue internals ─────────────────────────────────────────────────────

  private enqueue(item: Omit<AiQueueItem, 'id'>) {
    const queueItem: AiQueueItem = { ...item, id: generateUUID() };
    this._queue.push(queueItem);
    this.emit('queue-updated', this.getState());
    void this.processNext();
  }

  private async processNext() {
    if (this._processing || this._queue.length === 0) return;

    this._processing = true;
    const item = this._queue.shift()!;
    this._current = item;
    this._abortController = new AbortController();

    this.emit('request-started', { sessionId: item.sessionId, type: item.type });
    this.emit('queue-updated', this.getState());

    try {
      if (item.type === 'chat') {
        await this.processChat(item);
      } else {
        await this.processStudyAid(item);
      }
      this.emit('response-ready', {
        sessionId: item.sessionId,
        type: item.type,
      } satisfies AiResponseReadyPayload);
    } catch (error: any) {
      // Silently ignore user-initiated aborts
      if (error?.name === 'AbortError') {
        // Clean up optimistic message on abort
        if (item.type === 'chat' && item.tempId) {
          queryClient.setQueryData(aiKeys.history(item.sessionId), (old: any) => {
            return (old || []).filter((msg: any) => msg.id !== item.tempId);
          });
        }
      } else {
        console.warn(`[AiManager] Request failed (${item.type}):`, error);
        this.emit('request-error', {
          sessionId: item.sessionId,
          type: item.type,
          error,
        } satisfies AiRequestErrorPayload);

        // Mark optimistic message as failed
        if (item.type === 'chat' && item.tempId) {
          queryClient.setQueryData(aiKeys.history(item.sessionId), (old: any) => {
            return (old || []).map((msg: any) =>
              msg.id === item.tempId ? { ...msg, status: 'fail' } : msg
            );
          });
          localDb.upsertAiMessages(item.sessionId, [
            {
              id: item.tempId,
              role: 'user',
              content: item.payload.message!,
              createdAt: new Date().toISOString(),
              status: 'fail',
            },
          ]);
        }
      }
    } finally {
      this._current = null;
      this._abortController = null;
      this._processing = false;
      this.emit('queue-updated', this.getState());

      // Process next item in queue
      void this.processNext();
    }
  }

  // ── Chat processing ─────────────────────────────────────────────────────

  private async processChat(item: AiQueueItem) {
    const result = await aiApi.sendMessage(
      { message: item.payload.message!, sessionId: item.sessionId },
      { signal: this._abortController!.signal }
    );

    // Update sessions list
    queryClient.setQueryData(aiKeys.sessions(), (old: any) => {
      const existing = old || [];
      if (!existing.some((s: any) => s.id === result.session.id)) {
        return [result.session, ...existing];
      }
      return existing;
    });

    // Update tokens
    if (result.tokens) {
      queryClient.setQueryData(aiKeys.tokens(), result.tokens);
    } else {
      void queryClient.invalidateQueries({ queryKey: aiKeys.tokens() });
    }

    // Replace optimistic message with real messages
    queryClient.setQueryData(aiKeys.history(result.session.id), (old: any) => {
      let existing = old || [];

      // Remove optimistic message
      if (item.tempId) {
        existing = existing.filter((msg: any) => msg.id !== item.tempId);
      } else {
        existing = existing.filter((msg: any) => !msg.id.startsWith('temp-'));
      }

      // Append real messages (deduplicated)
      const newMessages: AiChatMessage[] = [];
      if (result.request && !existing.some((msg: any) => msg.id === result.request.id)) {
        newMessages.push(result.request);
      }
      if (result.message && !existing.some((msg: any) => msg.id === result.message.id)) {
        newMessages.push(result.message);
      }

      const updated = mergeAiMessages(existing, newMessages);
      localDb.upsertAiMessages(result.session.id, updated);
      return updated;
    });
  }

  // ── Study aid processing ────────────────────────────────────────────────

  private async processStudyAid(item: AiQueueItem) {
    const result = await aiApi.generateStudyAid(
      item.sessionId,
      item.payload.studyAidType!,
      { signal: this._abortController!.signal }
    );

    // Update tokens
    void queryClient.invalidateQueries({ queryKey: aiKeys.tokens() });

    // Append study aid message
    queryClient.setQueryData(aiKeys.history(item.sessionId), (old: any) => {
      const existing = old || [];
      if (!existing.some((msg: any) => msg.id === result.message.id)) {
        const studyAid: AiChatMessage = { ...result.message, kind: result.message.kind ?? 'study-aid', studyAidType: result.message.studyAidType ?? item.payload.studyAidType as AiChatMessage['studyAidType'] };
        const updated = mergeAiMessages(existing, [studyAid]);
        localDb.upsertAiMessages(item.sessionId, updated);
        return updated;
      }
      return existing;
    });
  }
}

// ── Export singleton ───────────────────────────────────────────────────────

export const AiRequestManager = new AiRequestManagerImpl();
