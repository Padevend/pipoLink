import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@/shared/api/messaging';

export const conversationKeys = {
  all: ['conversations'] as const,
  list: () => [...conversationKeys.all, 'list'] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
};

export const useConversations = () => {
  return useQuery({
    queryKey: conversationKeys.list(),
    queryFn: () => messagingApi.getConversations(),
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memberIds: string[]) => messagingApi.createConversation(memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
};
