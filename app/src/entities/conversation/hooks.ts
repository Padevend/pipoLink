import { useQuery } from '@tanstack/react-query';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import { messagingApi } from '@/shared/api/messaging';
import { localDb } from '@/shared/storage/local-db';

export const conversationKeys = {
  all: ['conversations'] as const,
  list: () => [...conversationKeys.all, 'list'] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
};

export const useConversations = () => {
  return useQuery({
    queryKey: conversationKeys.list(),
    queryFn: async () => {
      try {
        const remote = await messagingApi.getConversations();
        localDb.upsertConversations(remote);
        return remote;
      } catch (e) {
        console.error(e)
        const cached = localDb.getConversations();
        if (cached.length) return cached;
        throw new Error('Hors ligne — aucune conversation en cache.');
      }
    },
    initialData: () => {
      const cached = localDb.getConversations();
      return cached.length > 0 ? cached : undefined;
    },
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
