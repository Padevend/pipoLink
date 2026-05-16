import { setupOfflineSync } from '@/processes/offline-sync';
import { updatesApi } from '@/shared/api/updates';
import { initializeSqlite } from '@/shared/storage/sqlite';

let stopOfflineSync: (() => void) | null = null;

export async function runAppStartup(): Promise<void> {
  await initializeSqlite();
  stopOfflineSync?.();
  stopOfflineSync = setupOfflineSync();
  await updatesApi.checkUpdate().catch(() => undefined);
}
