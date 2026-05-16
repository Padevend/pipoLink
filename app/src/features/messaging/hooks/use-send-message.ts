import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { encryptMessage } from '@/shared/crypto/message';
import { messagingApi } from '@/shared/api/messaging';
import { localDb } from '@/shared/storage/local-db';
import { generateUUID } from '@/shared/utils/uuid';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      content: string;
      type: 'text' | 'image' | 'document';
      attachmentUrl?: string;
      attachmentName?: string;
      attachmentSize?: number;
    }) => {
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
          content_plain: input.content,
          message_type: input.type,
          created_at: new Date().toISOString(),
        });
        return { queued: true, id } as { queued: boolean; id: string };
      }

      const chatKey = await ensureChatKeyForChat(conversationId);
      const encrypted = await encryptMessage(input.content, chatKey);
      return messagingApi.sendMessage(conversationId, {
        content: encrypted.cipherText,
        iv: encrypted.iv,
        type: input.type === 'text' ? 'TEXT' : input.type === 'image' ? 'IMAGE' : 'DOCUMENT',
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previous = queryClient.getQueryData(['messages', conversationId]);
      queryClient.setQueryData(['messages', conversationId], (current: unknown) => current);
      return { previous, input };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', conversationId], context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
