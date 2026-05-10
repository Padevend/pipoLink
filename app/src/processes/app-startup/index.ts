import { updatesApi } from '@/shared/api/updates';
import { initializeSqlite } from '@/shared/storage/sqlite';

export async function runAppStartup(): Promise<void> {
  await initializeSqlite();
  await updatesApi.checkUpdate();
}
