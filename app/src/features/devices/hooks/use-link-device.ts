import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { DeviceQrPayload } from '@/features/devices/lib/verify-qr-payload';
import { getPayloadToken, verifyDeviceQrPayloadSignature } from '@/features/devices/lib/verify-qr-payload';
import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { encryptChatKeyForDevice } from '@/shared/crypto/chat-key';
import { authApi } from '@/shared/api/auth';
import { messagingApi } from '@/shared/api/messaging';

/**
 * Appareil principal : approuve l'appairage (scan QR).
 */
export function useLinkDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DeviceQrPayload) => {
      if (!verifyDeviceQrPayloadSignature(payload)) {
        throw new Error('QR Code invalide : signature incorrecte.');
      }

      const chats = await messagingApi.getConversations();
      const chatKeyBundle: { chatId: string; encryptedKey: string }[] = [];

      for (const chat of chats) {
        const key = await ensureChatKeyForChat(chat.id);
        const enc = await encryptChatKeyForDevice(key, payload.publicKey);
        chatKeyBundle.push({ chatId: chat.id, encryptedKey: enc });
        key.fill(0);
      }

      const res = await authApi.approvePairing({
        token: getPayloadToken(payload),
        chatKeyBundle,
      });
      return { deviceId: res.device.id, deviceName: res.device.name };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
