import { attachmentDownloadManager } from '@/features/attachments/lib/attachment-download.manager';
import { syncContactProfilesSilently } from '@/processes/contact-sync';
import { setupOfflineSync } from '@/processes/offline-sync';
import { setupRealtimeSync } from '@/processes/realtime-sync';
import { UpdateManager } from '@/processes/update-manager';
import { initializeSqlite } from '@/shared/storage/sqlite';
import { router } from 'expo-router';

let stopOfflineSync: (() => void) | null = null;
let stopRealtimeSync: (() => void) | null = null;

export async function runAppStartup(): Promise<void> {
  await initializeSqlite();
  stopOfflineSync?.();
  stopOfflineSync = setupOfflineSync();
  stopRealtimeSync?.();
  stopRealtimeSync = setupRealtimeSync();

  // Run silent contact sync in the background
  void syncContactProfilesSilently();

  await attachmentDownloadManager.initialize();

  // Non-blocking update check for critical updates
  UpdateManager.checkAndHandleUpdates().then((updateMeta) => {
    // If checkAndHandleUpdates returns metadata, it means it's a critical/high update
    // that requires a blocking UI. Low/medium are handled silently in the background.
    if (updateMeta) {
      setTimeout(() => {
        router.replace(`/updates`);
      }, 1000);
    }
  }).catch(() => undefined);
}
