import { localDb } from '@/shared/storage/local-db';
import { userApi } from '@/shared/api/user';
import { AsyncStorageService, ASYNC_STORAGE_KEYS } from '@/shared/lib/storage';
import type { UserWithProfile } from '@/shared/api/normalize-user';

// Ids déjà synchronisés durant cette session — évite de re-fetch à chaque reconnexion WS
const syncedThisSession = new Set<string>();
const CONCURRENCY = 4;

export async function syncContactProfilesSilently(): Promise<void> {
  try {
    // 1. Get current user to avoid self-sync
    const currentUser = await AsyncStorageService.get<UserWithProfile>(ASYNC_STORAGE_KEYS.USER_DATA);
    const currentUserId = currentUser?.id;

    // 2. Get all conversations and gather members
    const conversations = localDb.getConversations();
    const uniqueMemberIds = new Set<string>();

    for (const c of conversations) {
      if (c.members) {
        for (const m of c.members) {
          if (m.id && m.id !== currentUserId && !syncedThisSession.has(m.id)) {
            uniqueMemberIds.add(m.id);
          }
        }
      }
    }

    if (uniqueMemberIds.size === 0) return;

    // 3. Fetch contact profiles silently, bounded concurrency
    const memberIds = Array.from(uniqueMemberIds);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, memberIds.length) }, async () => {
      while (cursor < memberIds.length) {
        const id = memberIds[cursor++];
        try {
          const user = await userApi.getUser(id);
          if (user) {
            localDb.upsertUsers([user]);
            syncedThisSession.add(id);
          }
        } catch (err) {
          // Silent catch
        }
      }
    });
    await Promise.all(workers);
  } catch (err) {
    // Silent catch
  }
}
