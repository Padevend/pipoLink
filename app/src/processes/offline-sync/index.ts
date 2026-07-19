import { sendMessageToServer } from '@/features/messaging/lib/send-message-pipeline';
import { aiApi } from '@/shared/api/ai';
import { messagingApi } from '@/shared/api/messaging';
import { queryClient } from '@/providers/query-provider';
import { localDb } from '@/shared/storage/local-db';
import { wsManager } from '@/shared/websocket/manager';

let syncing = false;
let lastSyncSuccessAt = 0;
const MIN_SYNC_INTERVAL_MS = 60_000;

async function getPrefetchLimits(): Promise<{ chats: number; messages: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NetInfo = require('@react-native-community/netinfo').default as {
      fetch: () => Promise<{ type: string }>;
    };
    const state = await NetInfo.fetch();
    if (state.type === 'cellular') return { chats: 8, messages: 30 };
  } catch {
    // NetInfo optional
  }
  return { chats: 12, messages: 40 };
}

export async function syncFromServer(options?: { force?: boolean }): Promise<void> {
  if (syncing) return;
  if (!options?.force && Date.now() - lastSyncSuccessAt < MIN_SYNC_INTERVAL_MS) return;
  syncing = true;
  try {
    const conversations = await messagingApi.getConversations();
    localDb.replaceConversations(conversations);

    const limits = await getPrefetchLimits();
    await Promise.all(
      conversations.slice(0, limits.chats).map(async (c) => {
        try {
          const page = await messagingApi.getMessages(c.id, { page: 1, limit: limits.messages });
          localDb.upsertMessages(c.id, page.items);
        } catch {
          // ignore per-chat failures offline
        }
      }),
    );

    try {
      const sessions = await aiApi.getSessions();
      localDb.upsertAiSessions(sessions);
      await Promise.all(
        sessions.slice(0, 8).map(async (s) => {
          const history = await aiApi.getSessionHistory(s.id);
          localDb.upsertAiMessages(s.id, history.messages);
        }),
      );
    } catch {
      // AI optional when offline
    }

    await flushPendingMessages();

    lastSyncSuccessAt = Date.now();
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    void queryClient.invalidateQueries({ queryKey: ['ai'] });
  } finally {
    syncing = false;
  }
}

export async function flushPendingMessages(): Promise<void> {
  const pending = localDb.getPendingMessages();
  for (const row of pending) {
    if (row.retry_count > 5) continue;
    try {
      await sendMessageToServer(row.conversation_id, {
        content: row.content_plain,
        type: row.message_type === 'document' ? 'document' : 'text',
      });
      localDb.removePendingMessage(row.id);
      void queryClient.invalidateQueries({ queryKey: ['messages', row.conversation_id] });
    } catch {
      localDb.bumpPendingRetry(row.id);
    }
  }
}

export function setupOfflineSync(): () => void {
  let netUnsub: (() => void) | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NetInfo = require('@react-native-community/netinfo').default as {
      addEventListener: (cb: (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void) => () => void;
    };
    netUnsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (online) {
        void wsManager.connect();
        void syncFromServer();
      }
    });
  } catch {
    // NetInfo optional until installed
  }

  const wsUnsub = wsManager.on('status.change', (status: string) => {
    if (status === 'connected') {
      void syncFromServer();
    }
  });

  void syncFromServer();

  return () => {
    netUnsub?.();
    wsUnsub();
  };
}
