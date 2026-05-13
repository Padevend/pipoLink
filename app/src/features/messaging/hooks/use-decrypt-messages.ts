import { useCallback } from 'react';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { decryptMessage } from '@/shared/crypto/message';

export function useDecryptMessages(chatId: string) {
  return useCallback(
    async (cipherText: string, iv: string): Promise<string | null> => {
      try {
        const chatKey = await ensureChatKeyForChat(chatId);
        return await decryptMessage(cipherText, iv, chatKey);
      } catch {
        return null;
      }
    },
    [chatId],
  );
}
