import { attachmentDownloadManager } from '@/features/attachments/lib/attachment-download.manager';
import { setupOfflineSync } from '@/processes/offline-sync';
import { setupRealtimeSync } from '@/processes/realtime-sync';
import { updatesApi } from '@/shared/api/updates';
import { initializeSqlite } from '@/shared/storage/sqlite';

let stopOfflineSync: (() => void) | null = null;
let stopRealtimeSync: (() => void) | null = null;

export async function runAppStartup(): Promise<void> {
  await initializeSqlite();
  stopOfflineSync?.();
  stopOfflineSync = setupOfflineSync();
  stopRealtimeSync?.();
  stopRealtimeSync = setupRealtimeSync();

  await attachmentDownloadManager.initialize()
  await updatesApi.checkUpdate().catch(() => undefined);
}


  
