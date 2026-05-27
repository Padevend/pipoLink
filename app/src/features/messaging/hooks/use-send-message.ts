import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import type { DecryptedMessage } from '@/features/messaging/hooks/use-messages';
import {
  sendMessageToServer,
  type PickedFile,
  type SendMessageInput,
} from '@/features/messaging/lib/send-message-pipeline';
import { conversationKeys } from '@/entities/conversation/hooks';
import { useAuth } from '@/providers';
import type { Conversation } from '@/shared/api/messaging';
import type { Message, MessageType, PaginatedResponse } from '@/shared/api/types';
import { localDb } from '@/shared/storage/local-db';
import { generateUUID } from '@/shared/utils/uuid';

export type { PickedFile, SendMessageInput };

function appendOptimisticMessage(
  pages: PaginatedResponse<DecryptedMessage>[] | undefined,
  msg: DecryptedMessage,
): PaginatedResponse<DecryptedMessage>[] {
  if (!pages?.length) {
    return [
      {
        items: [msg],
        total: 1,
        page: 1,
        limit: 30,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    ];
  }
  const [first, ...rest] = pages;
  return [{ ...first, items: [...first.items, msg] }, ...rest];
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      let online = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const NetInfo = require('@react-native-community/netinfo').default as {
          fetch: () => Promise<{ isConnected: boolean | null; isInternetReachable: boolean | null }>;
        };
        const net = await NetInfo.fetch();
        online = net.isConnected === true && net.isInternetReachable !== false;
      } catch {
        online = true;
      }

      if (!online) {
        const id = generateUUID();
        
        localDb.queuePendingMessage({
          id,
          conversation_id: conversationId,
          content_plain: input.content || input.file?.name || '',
          message_type: input.file ? 'document' : input.type,
          created_at: new Date().toISOString(),
        });
        return { queued: true, id } as const;
      }
      return sendMessageToServer(conversationId, input);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previous = queryClient.getQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>([
        'messages',
        conversationId,
      ]);

      const tempId = `temp-${generateUUID()}`;
      const optimistic: DecryptedMessage = {
        id: tempId,
        chat_id: conversationId,
        sender_id: user?.id ?? '',
        cipherText: '',
        iv: '',
        status: 'send',
        type: (input.file ? (input.content.trim() ? 'MIXED' : 'DOCUMENT') : 'TEXT') as MessageType,
        created_at: new Date().toISOString(),
        attachments: input.file
          ? [
              {
                id: `temp-att-${generateUUID()}`,
                fileUrl: '',
                iv: '',
                fileName: input.file.name,
                fileSize: input.file.size ?? 0,
                mimeType: input.file.mimeType ?? 'application/octet-stream',
              },
            ]
          : [],
        decryptedContent:
          input.content.trim() || (input.file ? `📎 ${input.file.name}` : ''),
        decryptFailed: false,
      };

      queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
        ['messages', conversationId],
        (old) => {
          if (!old) {
            return {
              pageParams: [1],
              pages: appendOptimisticMessage(undefined, optimistic),
            };
          }
          return {
            ...old,
            pages: appendOptimisticMessage(old.pages, optimistic),
          };
        },
      );

      return { previous, tempId };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', conversationId], context.previous);
      }
    },
    onSuccess: (result, _input, context) => {
      if (result && 'queued' in result) return;
      const message = result as Message;
      localDb.upsertMessages(conversationId, [message]);

      queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
        ['messages', conversationId],
        (old) => {
          if (!old?.pages) return old;

          let realExists = false;
          old.pages.forEach((p) => {
            if (p.items.some((m) => m.id === message.id)) {
              realExists = true;
            }
          });

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.reduce<DecryptedMessage[]>((acc, m) => {
                if (m.id === context?.tempId) {
                  if (!realExists) {
                    acc.push({ ...m, ...message, id: message.id, status: 'send' });
                  }
                } else {
                  acc.push(m);
                }
                return acc;
              }, []),
            })),
          };
        },
      );

      queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (prev) => {
        if (!prev) return prev;
        const now = new Date().toISOString();
        return prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message,
                updatedAt: now,
              }
            : c,
        );
      });
    },
  });
}
