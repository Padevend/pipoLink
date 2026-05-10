import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@/shared/api/messaging';

export const messageKeys = {
  all: ['messages'] as const,
  byConversation: (conversationId: string) => [...messageKeys.all, 'conversation', conversationId] as const,
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: messageKeys.byConversation(conversationId),
    queryFn: () => messagingApi.getMessages(conversationId),
    enabled: !!conversationId,
  });
};

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: { content: string; iv: string; type?: string }) => 
      messagingApi.sendMessage(conversationId, payload),
    onSuccess: () => {
      // Typically we'd update the cache optimistically or wait for WS
      queryClient.invalidateQueries({ queryKey: messageKeys.byConversation(conversationId) });
    },
  });
};
