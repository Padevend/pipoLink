import { getChatKeyStatus, rotateChatKeyForRecovery } from '@/features/messaging/lib/chat-key-recovery';
import { messagingApi } from '@/shared/api/messaging';
import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';

/**
 * Proactively réinitialise les clés de conversations existantes après une récupération de clés.
 *
 * Le scénario : un utilisateur récupère ses clés (ou en génère de nouvelles).
 * Conséquence : les clés de conversations existantes ne sont plus valides car
 * elles ont été chiffrées pour les ANCIENNES identités. Pour les rendre à nouveau
 * accessibles, nous devons forcer une rotation des clés pour CHAQUE conversation
 * de l'utilisateur et vider leurs caches.
 */
export async function refreshExistingConversationKeys(): Promise<void> {
  try {
    const deviceId = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      console.warn('[refreshExistingConversationKeys] Pas d\'ID appareil');
      return;
    }

    const conversations = await messagingApi.getConversations();
    const existingChatIds = conversations.filter(c => c.id).map(c => c.id);

    if (existingChatIds.length === 0) {
      return;
    }

    console.log('[refreshExistingConversationKeys] Rafraîchissement de', existingChatIds.length, 'conversations');

    // Détection parallèle de l'état des clés et rotation séquentielle pour éviter les appels massifs.
    const results = await Promise.allSettled(
      existingChatIds.map(async (chatId) => {
        const status = await getChatKeyStatus(chatId);
        if (status === 'valid') {
          console.log('[refreshExistingConversationKeys] Clé déjà valide pour', chatId);
          return;
        }

        console.log('[refreshExistingConversationKeys] Rotation forcée de', chatId, '(statut:', status, ')');
        await rotateChatKeyForRecovery(chatId);
        console.log('[refreshExistingConversationKeys] Conversation', chatId, 'mise à jour');
      })
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn('[refreshExistingConversationKeys] Certaines rotations ont échoué:', failed);
    }

    // Assurer que les nouveaux paramètres de sécurité sont propagés.
    await SecureStorageService.remove('temp_login_email');
    await SecureStorageService.remove('temp_login_password');
    await SecureStorageService.remove('temp_key_backup');

    console.log('[refreshExistingConversationKeys] Rafraîchissement terminé');
  } catch (error) {
    console.error('[refreshExistingConversationKeys] Erreur:', error);
    // Ne pas bloquer le processus de récupération si le rafraîchissement échoue.
  }
}

/**
 * Wrapper pour laisser l'appelant décider s'il souhaite forcer un rafraîchissement complet.
 * À appeler après récupération réussie de clés ou génération de nouvelles clés.
 */
export async function refreshAllConversationKeys(shouldRefresh: boolean = true): Promise<void> {
  if (!shouldRefresh) {
    console.log('[refreshAllConversationKeys] Rafraîchissement désactivé');
    return;
  }
  await refreshExistingConversationKeys();
}
