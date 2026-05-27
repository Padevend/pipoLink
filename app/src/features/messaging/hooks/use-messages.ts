import { useInfiniteQuery } from '@tanstack/react-query';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { messagingApi } from '@/shared/api/messaging';
import { sortMessagesAsc } from '@/shared/api/normalize-message';
import type { Message, PaginatedResponse } from '@/shared/api/types';
import { decryptMessage } from '@/shared/crypto/message';
import { localDb } from '@/shared/storage/local-db';

export type DecryptedMessage = Message & {
  decryptedContent: string | null;
  decryptFailed: boolean;
  responseToDecrypted?: DecryptedMessage | null;
};

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<DecryptedMessage>> => {
      const page = pageParam as number;
      let raw;
      try {
        raw = await messagingApi.getMessages(conversationId, { page, limit: 30 });
        localDb.upsertMessages(conversationId, raw.items);
      } catch {
        const cached = localDb.getMessages(conversationId);
        if (!cached.length) throw new Error('Messages indisponibles hors ligne.');
        raw = {
          items: cached,
          total: cached.length,
          page: 1,
          limit: cached.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      let chatKey: Uint8Array | null = null;
      try {
        chatKey = await ensureChatKeyForChat(conversationId);
      } catch {
        chatKey = null;
      }

      const sorted = sortMessagesAsc(raw.items);

      const items: DecryptedMessage[] = await Promise.all(
        sorted.map(async (m) => {
          if (!chatKey) {
            return { ...m, decryptedContent: null, decryptFailed: true };
          }

          // decrypt messages
          const text = await decryptMessage(m.cipherText, m.iv, chatKey);

          let responseToDecrypted: DecryptedMessage | null = null;
          if (m.responseTo && chatKey) {
            const repText = await decryptMessage(m.responseTo.cipherText, m.responseTo.iv, chatKey);
            responseToDecrypted = {
              ...m.responseTo,
              decryptedContent: repText,
              decryptFailed: repText === null
            };
          } else if (m.responseTo) {
            responseToDecrypted = {
              ...m.responseTo,
              decryptedContent: null,
              decryptFailed: true
            };
          }

          return {
            ...m,
            decryptedContent: text,
            decryptFailed: text === null,
            responseToDecrypted
          };
        }),
      );

      const out: PaginatedResponse<DecryptedMessage> = {
        ...raw,
        items,
      };
      return out;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<DecryptedMessage>) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
}
