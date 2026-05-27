import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';

import { messagingApi } from '@/shared/api/messaging';
import {
  cacheChatKey,
  decryptChatKey,
  getCachedChatKey,
} from '@/shared/crypto/chat-key';

export async function ensureChatKeyForChat(chatId: string): Promise<Uint8Array> {
  const cached = await getCachedChatKey(chatId);
  if (cached) return cached;

  const deviceId = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    throw new Error('Appareil non enregistré : reconnectez-vous après onboarding.');
  }

  const { encryptedChatKey } = await messagingApi.getMyEncryptedChatKey(chatId, deviceId);
  const key = await decryptChatKey(encryptedChatKey);
  if (!key) {
    throw new Error('Impossible de déchiffrer la clé du chat.');
  }
  await cacheChatKey(chatId, key);
  return key;
}
