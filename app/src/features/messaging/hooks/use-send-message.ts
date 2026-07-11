import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { router } from 'expo-router';

import { conversationKeys } from '@/entities/conversation/hooks';
import type { DecryptedMessage } from '@/features/messaging/hooks/use-messages';
import {
  sendMessageToServer,
  type SendMessageInput as BaseSendMessageInput,
  type PickedFile,
} from '@/features/messaging/lib/send-message-pipeline';
import { useAuth } from '@/providers';
import type { Conversation } from '@/shared/api/messaging';
import type { Message, MessageType, PaginatedResponse } from '@/shared/api/types';
import { localDb } from '@/shared/storage/local-db';
import { generateUUID } from '@/shared/utils/uuid';


import { generateChatKey, encryptChatKeyForDevice, cacheChatKey } from "@/shared/crypto/chat-key";

export type SendMessageInput = BaseSendMessageInput & {
  isPending?: boolean;
  recipientUserId?: string;
};

export type { PickedFile };

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
        if (input.isPending) {
          throw new Error('Impossible d’ouvrir une nouvelle discussion hors ligne.');
        }
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

      let activeConversationId = conversationId;
      let newChatId: string | undefined;

      if (input.isPending && input.recipientUserId) {
        const meId = user?.id;
        if (!meId) throw new Error('Session invalide.');

        const unique = Array.from(new Set([meId, input.recipientUserId]));
        const deviceRows: { deviceId: string; publicKey: string }[] = [];

        // Dynamic imports to avoid dependency cycles if any
        const { userApi } = require('@/shared/api/user');
        const { messagingApi } = require('@/shared/api/messaging');

        for (const uid of unique) {
          const param = uid === meId ? 'me' : uid;
          const keys = await userApi.listDevicePublicKeys(param);
          for (const k of keys) {
            deviceRows.push(k);
          }
        }

        const chatKey = generateChatKey();
        const encryptedKeys = await Promise.all(
          deviceRows.map(async ({ deviceId, publicKey }) => ({
            deviceId,
            encryptedKey: await encryptChatKeyForDevice(chatKey, publicKey),
          })),
        );

        const chat = await messagingApi.createChat({
          type: 'private',
          name: null,
          memberUserIds: unique,
          encryptedKeys,
        });

        await cacheChatKey(chat.id, chatKey);
        chatKey.fill(0);

        activeConversationId = chat.id;
        newChatId = chat.id;
      }

      const message = await sendMessageToServer(activeConversationId, input);
      return { message, newChatId };
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
        responseToId: input.replyToId,
        responseToDecrypted: input.responseToMsg,
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
      // Au lieu de rollback tout le cache (ce qui écrase les autres messages en cours),
      // on supprime simplement le message temporaire qui a échoué.
      console.error('Erreur lors de l’envoi du message :', _error);
      if (context?.tempId) {
        queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
          ['messages', conversationId],
          (old) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((m) => m.id !== context.tempId),
              })),
            };
          }
        );
      }
    },
    onSuccess: (result, _input, context) => {
      if (result && 'queued' in result) {
        // En mode hors ligne, on garde le tempId mais on change son statut
        queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
          ['messages', conversationId],
          (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                items: page.items.map((m: any) =>
                  m.id === context?.tempId ? { ...m, status: 'error' } : m
                ),
              })),
            };
          }
        );
        return;
      }

      const { message, newChatId } = result as { message: Message; newChatId?: string };
      const targetChatId = newChatId || conversationId;

      if (newChatId) {
        // Copier les données de la clé temporaire vers la nouvelle clé de discussion réelle
        const tempQueryKey = ['messages', conversationId];
        const newQueryKey = ['messages', newChatId];

        const tempCache = queryClient.getQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(tempQueryKey);
        if (tempCache) {
          queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(newQueryKey, tempCache);
        }
        queryClient.removeQueries({ queryKey: tempQueryKey });
      }

      localDb.upsertMessages(targetChatId, [message]);

      queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
        ['messages', targetChatId],
        (old) => {
          if (!old?.pages) return old;

          // 1. Vérifier si le message réel existe déjà (via WS)
          let realExists = false;
          old.pages.forEach((p) => {
            if (p.items.some((m) => m.id === message.id)) {
              realExists = true;
            }
          });

          // 2. Nettoyer le tempId et insérer le message réel s'il manque
          const newPages = old.pages.map((page, index) => {
            let newItems = page.items.filter((m) => m.id !== context?.tempId);

            // On insère le message dans la première page s'il n'existe nulle part
            if (index === 0 && !realExists) {
              // Retrouver le message optimiste pour préserver decryptedContent
              const optimisticMsg = page.items.find(m => m.id === context?.tempId);
              newItems.push({
                ...(optimisticMsg || {}),
                ...message,
                id: message.id,
                status: 'send',
              } as DecryptedMessage);
            }

            // Si c'est la première page, on la trie pour éviter les sauts temporels
            if (index === 0) {
              newItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }

            return { ...page, items: newItems };
          });

          return { ...old, pages: newPages };
        },
      );

      queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (prev) => {
        if (!prev) return prev;
        const now = new Date().toISOString();

        // Si c'est une nouvelle conversation, on invalide la liste entière pour la recharger
        if (newChatId) {
          void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
          return prev;
        }

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

      if (newChatId) {
        setTimeout(() => {
          router.replace(`/chat/${newChatId}`);
        }, 100);
      }
    },
  });
}
