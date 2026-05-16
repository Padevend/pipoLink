import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { encryptMessage } from '@/shared/crypto/message';
import { aiApi } from '@/shared/api/ai';
import { messagingApi } from '@/shared/api/messaging';
import { queryClient } from '@/providers/query-provider';
import { localDb } from '@/shared/storage/local-db';
import { wsManager } from '@/shared/websocket/manager';

let syncing = false;

export async function syncFromServer(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    const conversations = await messagingApi.getConversations();
    localDb.upsertConversations(conversations);

    await Promise.all(
      conversations.slice(0, 12).map(async (c) => {
        try {
          const page = await messagingApi.getMessages(c.id, { page: 1, limit: 40 });
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
          localDb.upsertAiMessages(s.id, history);
        }),
      );
    } catch {
      // AI optional when offline
    }

    await flushPendingMessages();

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
      const chatKey = await ensureChatKeyForChat(row.conversation_id);
      const encrypted = await encryptMessage(row.content_plain, chatKey);
      await messagingApi.sendMessage(row.conversation_id, {
        content: encrypted.cipherText,
        iv: encrypted.iv,
        type: row.message_type === 'text' ? 'TEXT' : 'TEXT',
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
