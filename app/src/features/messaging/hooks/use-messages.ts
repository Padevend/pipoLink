import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { messagingApi } from '@/shared/api/messaging';
import { sortMessagesAsc } from '@/shared/api/normalize-message';
import type { Message, PaginatedResponse } from '@/shared/api/types';
import { decryptMessage } from '@/shared/crypto/message';
import { localDb } from '@/shared/storage/local-db';
import { queryClient } from '@/providers';

export type DecryptedMessage = Message & {
  decryptedContent: string | null;
  decryptFailed: boolean;
  responseToDecrypted?: DecryptedMessage | null;
};

export function useMessages(conversationId: string, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<DecryptedMessage>> => {
      const page = pageParam as number;

      let chatKey: Uint8Array | null = null;
      try {
        chatKey = await ensureChatKeyForChat(conversationId);
      } catch {
        chatKey = null;
      }

      if (page === 1) {
        // --- OFFLINE FIRST: Load from SQLite instantly ---
        const cached = localDb.getMessages(conversationId);
        
        // Decrypt the cached items immediately
        const cachedItems: DecryptedMessage[] = await Promise.all(
          sortMessagesAsc(cached).map(async (m) => {
            if (!chatKey) return { ...m, decryptedContent: null, decryptFailed: true };
            const text = await decryptMessage(m.cipherText, m.iv, chatKey);
            let responseToDecrypted: DecryptedMessage | null = null;
            if (m.responseTo) {
              const repText = await decryptMessage(m.responseTo.cipherText, m.responseTo.iv, chatKey);
              responseToDecrypted = {
                ...m.responseTo,
                decryptedContent: repText,
                decryptFailed: repText === null
              };
            }
            return {
              ...m,
              decryptedContent: text,
              decryptFailed: text === null,
              responseToDecrypted
            };
          })
        );

        // --- BACKGROUND SYNC ---
        // Fire async API request without blocking the local cache response
        (async () => {
          try {
            const networkRaw = await messagingApi.getMessages(conversationId, { page: 1, limit: 30 });
            localDb.upsertMessages(conversationId, networkRaw.items);

            let ck: Uint8Array | null = null;
            try {
              ck = await ensureChatKeyForChat(conversationId);
            } catch {
              ck = null;
            }

            const decryptedNetwork = await Promise.all(
              networkRaw.items.map(async (m) => {
                if (!ck) return { ...m, decryptedContent: null, decryptFailed: true };
                const text = await decryptMessage(m.cipherText, m.iv, ck);
                let responseToDecrypted: DecryptedMessage | null = null;
                if (m.responseTo) {
                  const repText = await decryptMessage(m.responseTo.cipherText, m.responseTo.iv, ck);
                  responseToDecrypted = {
                    ...m.responseTo,
                    decryptedContent: repText,
                    decryptFailed: repText === null
                  };
                }
                return {
                  ...m,
                  decryptedContent: text,
                  decryptFailed: text === null,
                  responseToDecrypted
                };
              })
            );

            // Update React Query state in-place
            queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
              ['messages', conversationId],
              (old: InfiniteData<PaginatedResponse<DecryptedMessage>> | undefined) => {
                if (!old?.pages?.length) return old;
                const pages = old.pages.map((p: PaginatedResponse<DecryptedMessage>, idx: number) => {
                  if (idx !== 0) return p;

                  const itemMap = new Map<string, DecryptedMessage>();
                  // Load network items
                  decryptedNetwork.forEach((item: DecryptedMessage) => itemMap.set(item.id, item));
                  // Overlay existing items (preserving unsent temp- messages or WS messages)
                  p.items.forEach((item: DecryptedMessage) => {
                    if (item.id.startsWith('temp-') || !itemMap.has(item.id)) {
                      itemMap.set(item.id, item);
                    }
                  });

                  const merged = sortMessagesAsc(Array.from(itemMap.values())) as DecryptedMessage[];
                  return {
                    ...p,
                    items: merged,
                    hasNextPage: networkRaw.hasNextPage,
                  };
                });
                return { ...old, pages };
              }
            );
          } catch (err) {
            console.warn('[useMessages] Background sync failed:', err);
          }
        })();

        return {
          items: cachedItems,
          total: cached.length,
          page: 1,
          limit: 30,
          totalPages: Math.ceil(cached.length / 30) || 1,
          hasNextPage: cached.length >= 30,
          hasPreviousPage: false,
        };
      }

      // --- PAGE > 1: Load more history from network ---
      let raw;
      try {
        raw = await messagingApi.getMessages(conversationId, { page, limit: 30 });
        localDb.upsertMessages(conversationId, raw.items);
      } catch {
        const cached = localDb.getMessages(conversationId);
        raw = {
          items: cached,
          total: cached.length,
          page: page,
          limit: 30,
          totalPages: Math.ceil(cached.length / 30) || 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      const sorted = sortMessagesAsc(raw.items);

      const items: DecryptedMessage[] = await Promise.all(
        sorted.map(async (m) => {
          if (!chatKey) {
            return { ...m, decryptedContent: null, decryptFailed: true };
          }

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
    enabled: options?.enabled !== false,
    refetchOnMount: true,
    staleTime: 0,
  });
}
