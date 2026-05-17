import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { encryptChatKeyForDevice } from '@/shared/crypto/chat-key';
import { authApi } from '@/shared/api/auth';
import { messagingApi } from '@/shared/api/messaging';

/**
 * Appareil principal : approuve via code à 6 caractères (sans scan caméra).
 */
export function useApproveByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shortCode: string) => {
      const code = shortCode.trim().toUpperCase();
      if (code.length < 4) throw new Error('Code trop court.');

      const preview = await authApi.previewPairing({ shortCode: code });

      const chats = await messagingApi.getConversations();
      const chatKeyBundle: { chatId: string; encryptedKey: string }[] = [];

      for (const chat of chats) {
        const key = await ensureChatKeyForChat(chat.id);
        const enc = await encryptChatKeyForDevice(key, preview.publicKey);
        chatKeyBundle.push({ chatId: chat.id, encryptedKey: enc });
        key.fill(0);
      }

      const res = await authApi.approvePairing({
        shortCode: code,
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
