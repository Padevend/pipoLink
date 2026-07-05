import { localDb } from '@/shared/storage/local-db';
import { userApi } from '@/shared/api/user';
import { AsyncStorageService, ASYNC_STORAGE_KEYS } from '@/shared/lib/storage';
import type { UserWithProfile } from '@/shared/api/normalize-user';

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
          if (m.id && m.id !== currentUserId) {
            uniqueMemberIds.add(m.id);
          }
        }
      }
    }

    if (uniqueMemberIds.size === 0) return;

    // 3. Fetch each contact profile silently in background
    const memberIds = Array.from(uniqueMemberIds);
    for (const id of memberIds) {
      try {
        const user = await userApi.getUser(id);
        if (user) {
          localDb.upsertUsers([user]);
        }
      } catch (err) {
        // Silent catch
      }
    }
  } catch (err) {
    // Silent catch
  }
}
