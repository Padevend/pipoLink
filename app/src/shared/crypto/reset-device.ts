
import { clearIdentityKeys } from '@/shared/crypto/keys';
import { AsyncStorageService, SecureStorageService } from '@/shared/lib/storage';

const CHAT_KEY_REGISTRY = 'chat_key_registry';

/** Enregistre l'id d'un chat dont la clé est en cache (pour purge ultérieure). */
export async function registerCachedChatId(chatId: string): Promise<void> {
  const ids = await AsyncStorageService.get<string[]>(CHAT_KEY_REGISTRY) ?? [];
  if (!ids.includes(chatId)) {
    await AsyncStorageService.set(CHAT_KEY_REGISTRY, [...ids, chatId]);
  }
}

/** Supprime toutes les clés de chat locales. */
export async function clearCachedChatKeys(): Promise<void> {
  const ids = await AsyncStorageService.get<string[]>(CHAT_KEY_REGISTRY) ?? [];
  await Promise.all(ids.map((id) => SecureStorageService.remove(`chat_key_${id}`).catch(() => undefined)));
  await AsyncStorageService.remove(CHAT_KEY_REGISTRY);
}

/**
 * Prépare l'appareil pour un nouveau compte (ex-appareil secondaire).
 * À appeler avant inscription / onboarding.
 */
export async function wipeDeviceForNewAccount(): Promise<void> {
  await clearIdentityKeys();
  await clearCachedChatKeys();
}
