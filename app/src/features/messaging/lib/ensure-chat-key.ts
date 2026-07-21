import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';

import { ApiError } from '@/shared/api/client';
import { messagingApi } from '@/shared/api/messaging';
import {
  cacheChatKey,
  decryptChatKey,
  getCachedChatKey,
} from '@/shared/crypto/chat-key';
import { rotateChatKeyForChat } from './rotate-chat-key';

// Dédup des rotations concurrentes (plusieurs messages envoyés en rafale)
const inflightRotations = new Map<string, Promise<Uint8Array>>();

function rotateOnce(chatId: string): Promise<Uint8Array> {
  const existing = inflightRotations.get(chatId);
  if (existing) return existing;
  const p = rotateChatKeyForChat(chatId).finally(() => inflightRotations.delete(chatId));
  inflightRotations.set(chatId, p);
  return p;
}

export async function ensureChatKeyForChat(chatId: string): Promise<Uint8Array> {
  const cached = await getCachedChatKey(chatId);
  if (cached) return cached;

  const deviceId = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    throw new Error('Appareil non enregistré : reconnectez-vous après onboarding.');
  }

  let encryptedChatKey: string;
  try {
    ({ encryptedChatKey } = await messagingApi.getMyEncryptedChatKey(chatId, deviceId));
  } catch (e) {
    // Aucune clé pour cet appareil (ex. clés régénérées après récupération) :
    // rotation de la clé du chat pour redevenir opérationnel.
    if (e instanceof ApiError && e.status === 404) {
      return rotateOnce(chatId);
    }
    throw e;
  }

  const key = await decryptChatKey(encryptedChatKey);
  if (!key) {
    // La clé existe côté serveur mais est chiffrée pour d'anciennes clés
    // d'identité (bypass de récupération) : rotation.
    return rotateOnce(chatId);
  }
  await cacheChatKey(chatId, key);
  return key;
}
