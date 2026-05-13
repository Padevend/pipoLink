import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { DeviceQrPayloadV1 } from '@/features/devices/lib/verify-qr-payload';
import { verifyDeviceQrPayloadSignature } from '@/features/devices/lib/verify-qr-payload';
import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { encryptChatKeyForDevice } from '@/shared/crypto/chat-key';
import { devicesApi } from '@/shared/api/devices';

/**
 * Côté **appareil principal** : scan du QR du nouvel appareil, redistribution des clés AES (agent.md §10).
 */
export function useLinkDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DeviceQrPayloadV1) => {
      if (!verifyDeviceQrPayloadSignature(payload)) {
        throw new Error('QR Code invalide : signature incorrecte.');
      }

      const { messagingApi } = await import('@/shared/api/messaging');
      const chats = await messagingApi.getConversations();
      const chatKeyBundle: { chatId: string; encryptedKey: string }[] = [];

      for (const chat of chats) {
        const key = await ensureChatKeyForChat(chat.id);
        const enc = await encryptChatKeyForDevice(key, payload.publicKey);
        chatKeyBundle.push({ chatId: chat.id, encryptedKey: enc });
        key.fill(0);
      }

      return devicesApi.verifyQr({
        token: payload.token,
        deviceName: payload.deviceName,
        platform: payload.platform,
        fingerprint: payload.fingerprint,
        newDevice: { publicKey: payload.publicKey, keySignature: payload.keySignature },
        chatKeyBundle,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
