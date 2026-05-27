import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';

import { authApi } from '@/shared/api/auth';
import { wipeDeviceForNewAccount } from '@/shared/crypto/reset-device';
import { generateUUID } from '@/shared/utils/uuid';

/**
 * Détache l'appareil de l'ancien compte (DB) et efface toutes les clés locales.
 * À appeler avant inscription d'un nouveau compte.
 */
export async function prepareDeviceForNewAccount(): Promise<string> {
  let fingerprint = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT);
  if (!fingerprint) {
    fingerprint = generateUUID();
    await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
  }

  try {
    await authApi.detachDeviceByFingerprint(fingerprint);
  } catch {
    // Pas d'ancien compte lié — on continue
  }

  await wipeDeviceForNewAccount();
  return fingerprint;
}
