import { useQuery } from '@tanstack/react-query';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
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

/** Création de chat privé — enveloppe `useCreateChat`. */
export const useCreateConversation = () => {
  const m = useCreateChat();
  return {
    ...m,
    mutate: (memberIds: string[]) => m.mutate({ type: 'private', name: null, memberUserIds: memberIds }),
    mutateAsync: (memberIds: string[]) =>
      m.mutateAsync({ type: 'private', name: null, memberUserIds: memberIds }),
  };
};

export { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
