import { updatesApi } from '@/shared/api/updates';

export async function checkForOtaUpdate(): Promise<boolean> {
  const remote = await updatesApi.checkUpdate();
  return Boolean(remote);
}
