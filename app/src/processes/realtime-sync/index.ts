import { type InfiniteData } from '@tanstack/react-query';

import type { DecryptedMessage } from '@/features/messaging/hooks/use-messages';
import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { WS_EVENTS } from '@/shared/constants/ws-events';
import { normalizeConversation, type RawConversation } from '@/shared/api/normalize-conversation';
import { normalizeMessage, sortMessagesAsc, type RawMessage } from '@/shared/api/normalize-message';
import { decryptMessage } from '@/shared/crypto/message';
import { announcementKeys } from '@/entities/announcement/hooks';
import { queryClient } from '@/providers';
import type { Announcement } from '@/shared/api/announcements';
import type { Conversation } from '@/shared/api/messaging';
import type { Message, PaginatedResponse } from '@/shared/api/types';
import { localDb } from '@/shared/storage/local-db';
import { on } from '@/shared/websocket/manager';

type MessageCreatedPayload = {
  conversationId: string;
  message: RawMessage;
};

type ConversationUpdatedPayload = {
  conversationId: string;
  lastMessage?: RawMessage;
  unreadCount?: number;
};

async function decryptForCache(message: Message): Promise<DecryptedMessage> {
  try {
    const chatKey = await ensureChatKeyForChat(message.chat_id);
    const text = await decryptMessage(message.cipherText, message.iv, chatKey);
    return {
      ...message,
      decryptedContent: text,
      decryptFailed: text === null,
    };
  } catch {
    return { ...message, decryptedContent: null, decryptFailed: true };
  }
}

function upsertMessageInCache(conversationId: string, incoming: DecryptedMessage): void {
  queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
    ['messages', conversationId],
    (old) => {
      if (!old?.pages?.length) return old;

      const pages = old.pages.map((page, index) => {
        if (index !== 0) return page;
        const exists = page.items.some((m) => m.id === incoming.id);
        if (exists) {
          return {
            ...page,
            items: page.items.map((m) => (m.id === incoming.id ? incoming : m)),
          };
        }

        const tempIndex = page.items.findIndex(
          (m) =>
            m.id.startsWith('temp-') &&
            m.sender_id === incoming.sender_id &&
            m.decryptedContent === incoming.decryptedContent
        );

        if (tempIndex !== -1) {
          const newItems = [...page.items];
          newItems[tempIndex] = incoming;
          return { ...page, items: sortMessagesAsc(newItems) as DecryptedMessage[] };
        }

        return { ...page, items: sortMessagesAsc([...page.items, incoming]) as DecryptedMessage[] };
      });

      return { ...old, pages };
    },
  );
}

export function setupRealtimeSync(): () => void {
  const unsubscribers = [
    on<MessageCreatedPayload>(WS_EVENTS.MESSAGE_CREATED, async (payload) => {
      const message = normalizeMessage({ ...payload.message, chat_id: payload.conversationId });
      localDb.upsertMessages(payload.conversationId, [message]);

      const decrypted = await decryptForCache(message);
      upsertMessageInCache(payload.conversationId, decrypted);

      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }),

    on<ConversationUpdatedPayload>(WS_EVENTS.CONVERSATION_UPDATED, (payload) => {
      const cached = localDb.getConversations();
      const existing = cached.find((c) => c.id === payload.conversationId);
      if (!existing) {
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        return;
      }

      const updated: Conversation = {
        ...existing,
        unreadCount: payload.unreadCount ?? existing.unreadCount,
        lastMessage: payload.lastMessage
          ? normalizeMessage(payload.lastMessage)
          : existing.lastMessage,
        updatedAt: payload.lastMessage?.created_at
          ? String(payload.lastMessage.created_at)
          : existing.updatedAt,
      };

      localDb.upsertConversations([updated]);
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }),

    on<{ conversation: RawConversation }>(WS_EVENTS.CONVERSATION_CREATED, (payload) => {
      const conversation = normalizeConversation(payload.conversation);
      localDb.upsertConversations([conversation]);
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }),

    on<{ message: RawMessage }>(WS_EVENTS.MESSAGE_UPDATED, async (payload) => {
      const message = normalizeMessage(payload.message);
      localDb.upsertMessages(message.chat_id, [message]);
      const decrypted = await decryptForCache(message);
      upsertMessageInCache(message.chat_id, decrypted);
    }),

    on<{ conversationId: string; messageId: string }>(WS_EVENTS.MESSAGE_DELETED, (payload) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', payload.conversationId] });
    }),

    on<{ conversationId: string; userId: string }>(WS_EVENTS.MESSAGE_READ, ({ conversationId, userId }) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
        ['messages', conversationId],
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) => {
                if (m.sender_id !== userId && m.status !== 'read') {
                  return { ...m, status: 'read' as const };
                }
                return m;
              }),
            })),
          };
        }
      );
    }),

    on(WS_EVENTS.DOCUMENT_UPLOADED, () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    }),

    on<Announcement>(WS_EVENTS.ANNOUNCEMENT_CREATED, (announcement) => {
      queryClient.setQueryData<Announcement[]>(announcementKeys.list(), (prev) => {
        if (!prev) return [announcement];
        if (prev.some((a) => a.id === announcement.id)) return prev;
        return [announcement, ...prev];
      });
    }),

    on<void>(WS_EVENTS.NOTIFICATION_CREATED, () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
