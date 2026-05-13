import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import {
  cacheChatKey,
  decryptChatKey,
  encryptChatKeyForDevice,
  generateChatKey,
  getCachedChatKey,
} from '@/shared/crypto/chat-key';
import { encryptMessage } from '@/shared/crypto/message';
import { messagingApi } from '@/shared/api/messaging';
import { userApi } from '@/shared/api/user';

async function resolveMeId(): Promise<string> {
  const raw = await SecureStore.getItemAsync('user_data');
  if (!raw) throw new Error('Session introuvable.');
  const u = JSON.parse(raw) as { id: string };
  if (!u?.id) throw new Error('Session invalide.');
  return u.id;
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: 'private' | 'group';
      name?: string | null;
      memberUserIds: string[];
    }) => {
      const meId = await resolveMeId();
      const unique = Array.from(new Set([meId, ...input.memberUserIds]));
      const deviceRows: { deviceId: string; publicKey: string }[] = [];

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
        type: input.type,
        name: input.type === 'group' ? input.name ?? null : null,
        memberUserIds: unique,
        encryptedKeys,
      });

      await cacheChatKey(chat.id, chatKey);
      chatKey.fill(0);

      return chat;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
