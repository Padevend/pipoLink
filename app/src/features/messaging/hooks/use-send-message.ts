import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useKeyExchange } from '@/features/encryption/hooks/use-key-exchange';
import { messagingApi } from '@/shared/api/messaging';
import { encryptMessage } from '@/shared/crypto/encrypt';

export function useSendMessage(conversationId: string) {
  const { sessionKey } = useKeyExchange(conversationId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { content: string; type: 'text' | 'image' | 'document'; attachmentUrl?: string; attachmentName?: string; attachmentSize?: number }) => {
      const encrypted = await encryptMessage(input.content, sessionKey);
      return messagingApi.sendMessage(
        conversationId,
        {
          content: encrypted.ciphertext,
          type: input.type,
          iv: encrypted.iv,
          // Note: attachment fields are missing in api type, passing them as unknown for now
          ...(input as any)
        }
      );
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
