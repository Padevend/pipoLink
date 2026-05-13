import { useInfiniteQuery } from '@tanstack/react-query';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { messagingApi } from '@/shared/api/messaging';
import { decryptMessage } from '@/shared/crypto/message';
import type { Message, PaginatedResponse } from '@/shared/api/types';

export type DecryptedMessage = Message & {
  decryptedContent: string | null;
  decryptFailed: boolean;
};

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number;
      const raw = await messagingApi.getMessages(conversationId, { page, limit: 30 });
      let chatKey: Uint8Array | null = null;
      try {
        chatKey = await ensureChatKeyForChat(conversationId);
      } catch {
        chatKey = null;
      }

      const items: DecryptedMessage[] = await Promise.all(
        raw.items.map(async (m) => {
          if (!chatKey) {
            return { ...m, decryptedContent: null, decryptFailed: true };
          }
          const text = await decryptMessage(m.cipherText, m.iv, chatKey);
          return {
            ...m,
            decryptedContent: text,
            decryptFailed: text === null,
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
