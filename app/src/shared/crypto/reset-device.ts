
import { clearIdentityKeys } from '@/shared/crypto/keys';
import { getJson, removeItem, setJson } from '@/shared/storage/async-storage';
import { removeSecureItem } from '@/shared/storage/secure-storage';

const CHAT_KEY_REGISTRY = 'chat_key_registry';

/** Enregistre l'id d'un chat dont la clé est en cache (pour purge ultérieure). */
export async function registerCachedChatId(chatId: string): Promise<void> {
  const ids = await getJson<string[]>(CHAT_KEY_REGISTRY, []);
  if (!ids.includes(chatId)) {
    await setJson(CHAT_KEY_REGISTRY, [...ids, chatId]);
  }
}

/** Supprime toutes les clés de chat locales. */
export async function clearCachedChatKeys(): Promise<void> {
  const ids = await getJson<string[]>(CHAT_KEY_REGISTRY, []);
  await Promise.all(ids.map((id) => removeSecureItem(`chat_key_${id}`).catch(() => undefined)));
  await removeItem(CHAT_KEY_REGISTRY);
}

/**
 * Prépare l'appareil pour un nouveau compte (ex-appareil secondaire).
 * À appeler avant inscription / onboarding.
 */
export async function wipeDeviceForNewAccount(): Promise<void> {
  await clearIdentityKeys();
  await clearCachedChatKeys();
}
