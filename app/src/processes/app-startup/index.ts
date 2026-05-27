import { attachmentDownloadManager } from '@/features/attachments/lib/attachment-download.manager';
import { setupOfflineSync } from '@/processes/offline-sync';
import { setupRealtimeSync } from '@/processes/realtime-sync';
import { updatesApi } from '@/shared/api/updates';
import { initializeSqlite } from '@/shared/storage/sqlite';
import { router, usePathname } from 'expo-router';
import Constants from 'expo-constants';
import { UpdateManager } from '@/processes/update-manager';

let stopOfflineSync: (() => void) | null = null;
let stopRealtimeSync: (() => void) | null = null;

export async function runAppStartup(): Promise<void> {
  await initializeSqlite();
  stopOfflineSync?.();
  stopOfflineSync = setupOfflineSync();
  stopRealtimeSync?.();
  stopRealtimeSync = setupRealtimeSync();

  await attachmentDownloadManager.initialize()

  // Non-blocking update check
  UpdateManager.checkAndHandleUpdates().then((updateData) => {
    if (updateData) {
      const isCriticalOrRequired = updateData.severity === 'critical' || updateData.isRequired;
      const isManual = updateData.type === 'manual';
      
      if (isCriticalOrRequired || isManual) {
        setTimeout(() => {
          router.replace(`/updates`);
        }, 1000);
      }
    }
  }).catch(() => undefined);
}
