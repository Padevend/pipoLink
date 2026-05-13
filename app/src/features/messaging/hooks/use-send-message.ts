import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { encryptMessage } from '@/shared/crypto/message';
import { messagingApi } from '@/shared/api/messaging';

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
