import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import { messagingApi } from '@/shared/api/messaging';
import { userApi } from '@/shared/api/user';
import { localDb } from '@/shared/storage/local-db';
import { getCachedChatKey, encryptChatKeyForDevice } from '@/shared/crypto/chat-key';

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
        const cached = localDb.getConversations();
        if (cached.length) return cached;
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

export const useUpdateGroupDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, name }: { chatId: string; name: string }) =>
      messagingApi.updateChatDetails(chatId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
};

export const usePromoteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, targetUserId }: { chatId: string; targetUserId: string }) =>
      messagingApi.promoteMember(chatId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
};

export const useDemoteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, targetUserId }: { chatId: string; targetUserId: string }) =>
      messagingApi.demoteMember(chatId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
};

export const useKickMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, targetUserId }: { chatId: string; targetUserId: string }) =>
      messagingApi.kickMember(chatId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
};

export const useGroupInvitations = (chatId: string) => {
  return useQuery({
    queryKey: [...conversationKeys.all, 'invitations', chatId],
    queryFn: () => messagingApi.listInvitations(chatId),
    enabled: !!chatId,
  });
};

export const useCreateGroupInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      maxUses,
      expiresAt,
      encryptedChatKey,
    }: {
      chatId: string;
      maxUses?: number;
      expiresAt?: string;
      encryptedChatKey?: string;
    }) => messagingApi.createInvitation(chatId, { maxUses, expiresAt, encryptedChatKey }),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: [...conversationKeys.all, 'invitations', chatId] });
    },
  });
};

export const useRevokeGroupInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId }: { invitationId: string; chatId: string }) =>
      messagingApi.revokeInvitation(invitationId),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: [...conversationKeys.all, 'invitations', chatId] });
    },
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chatId, userId }: { chatId: string; userId: string }) => {
      let chatKey = await getCachedChatKey(chatId);
      if (!chatKey) {
        throw new Error('Symmetric chat key not found in cache.');
      }
      const deviceKeys = await userApi.listDevicePublicKeys(userId);
      const encryptedKeys = await Promise.all(
        deviceKeys.map(async ({ deviceId, publicKey }) => ({
          deviceId,
          encryptedKey: await encryptChatKeyForDevice(chatKey!, publicKey),
        })),
      );
      const updatedChat = await messagingApi.addMember(chatId, {
        userId,
        encryptedKeys,
      });
      return updatedChat;
    },
    onSuccess: (_, { chatId }) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(chatId) });
    },
  });
};

export { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
