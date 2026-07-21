import { messagingApi } from '@/shared/api/messaging';
import { userApi } from '@/shared/api/user';
import {
  cacheChatKey,
  encryptChatKeyForDevice,
  generateChatKey,
} from '@/shared/crypto/chat-key';
import { localDb } from '@/shared/storage/local-db';

/**
 * Rotation de la clé d'un chat : génère une nouvelle clé symétrique et la
 * distribue (chiffrée) à TOUS les appareils actifs des membres, puis remplace
 * les clés côté serveur. Utilisé quand cet appareil ne peut plus déchiffrer la
 * clé existante (ex. « générer de nouvelles clés » après perte des clés).
 *
 * Conséquence assumée : l'historique chiffré avec l'ancienne clé reste
 * illisible pour l'appareil récupéré, mais l'échange redevient fonctionnel
 * pour tous les membres.
 */
export async function rotateChatKeyForChat(chatId: string): Promise<Uint8Array> {
  // Récupérer les membres du chat (cache local d'abord, réseau sinon)
  let conversation = localDb.getConversations().find((c) => c.id === chatId);
  if (!conversation || !conversation.members?.length) {
    const remote = await messagingApi.getConversations();
    conversation = remote.find((c) => c.id === chatId);
  }
  if (!conversation || !conversation.members?.length) {
    throw new Error('Conversation introuvable pour la rotation de clé.');
  }

  const newKey = generateChatKey();

  const keys: { deviceId: string; encryptedKey: string }[] = [];
  for (const member of conversation.members) {
    try {
      const deviceKeys = await userApi.listDevicePublicKeys(member.id);
      for (const { deviceId, publicKey } of deviceKeys) {
        if (!publicKey) continue;
        keys.push({
          deviceId,
          encryptedKey: await encryptChatKeyForDevice(newKey, publicKey),
        });
      }
    } catch {
      // Un membre sans appareil accessible ne bloque pas la rotation
    }
  }

  if (keys.length === 0) {
    throw new Error('Aucun appareil membre disponible pour la rotation de clé.');
  }

  await messagingApi.rotateChatKey(chatId, keys);
  await cacheChatKey(chatId, newKey);
  return newKey;
}
