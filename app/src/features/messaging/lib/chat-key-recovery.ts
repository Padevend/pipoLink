import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';
import { ApiError } from '@/shared/api/client';
import { messagingApi } from '@/shared/api/messaging';
import { cacheChatKey, decryptChatKey, getCachedChatKey } from '@/shared/crypto/chat-key';
import { rotateChatKeyForChat } from './rotate-chat-key';

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
    // 404 — clés régénérées (bypass de récupération)
    if (e instanceof ApiError && e.status === 404) {
      return rotateOnce(chatId);
    }
    throw e;
  }

  const key = await decryptChatKey(encryptedChatKey);
  if (!key) {
    // Clé chiffrée pour anciennes identités → rotation pure
    return rotateOnce(chatId);
  }

  await cacheChatKey(chatId, key);
  return key;
}

/**
 * Service unifié de récupération de clés avec détection automatique du statut.
 * Retourne l'état de la clé (valid/invalid/missing) + éventuellement la clé si valide.
 */
export async function getChatKeyStatus(chatId: string): Promise<'valid' | 'invalid' | 'missing'> {
  try {
    const key = await getCachedChatKey(chatId);
    if (key) return 'valid';

    const deviceId = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) return 'missing';

    const { encryptedChatKey } = await messagingApi.getMyEncryptedChatKey(chatId, deviceId);
    const decrypted = await decryptChatKey(encryptedChatKey);
    if (!decrypted) return 'invalid';

    await cacheChatKey(chatId, decrypted);
    return 'valid';
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return 'invalid';
    }
    return 'missing';
  }
}

/**
 * Force la rotation d'une clé de conversation et purge son cache.
 * À utiliser après récupération de clés pour forcer la génération de nouvelles clés pour un chat spécifique.
 */
export async function rotateChatKeyForRecovery(chatId: string): Promise<void> {
  await SecureStorageService.remove('chat_key_' + chatId);
  await rotateOnce(chatId);
}

/**
 * Purge le cache de conversations et force la réintégration après récupération de clés.
 * À appeler après toute génération/réinitialisation de clés.
 */
export async function purgeConversationCache(): Promise<void> {
  // Pas besoin d'importer clearCachedChatKeys pour éviter les imports circulaires
  const { clearCachedChatKeys } = await import('@/shared/crypto/reset-device').then(m => m);
  await clearCachedChatKeys();
}