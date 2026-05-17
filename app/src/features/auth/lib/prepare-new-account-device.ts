import * as SecureStore from 'expo-secure-store';

import { authApi } from '@/shared/api/auth';
import { wipeDeviceForNewAccount } from '@/shared/crypto/reset-device';
import { generateUUID } from '@/shared/utils/uuid';

/**
 * Détache l'appareil de l'ancien compte (DB) et efface toutes les clés locales.
 * À appeler avant inscription d'un nouveau compte.
 */
export async function prepareDeviceForNewAccount(): Promise<string> {
  let fingerprint = await SecureStore.getItemAsync('device_fingerprint');
  if (!fingerprint) {
    fingerprint = generateUUID();
    await SecureStore.setItemAsync('device_fingerprint', fingerprint);
  }

  try {
    await authApi.detachDeviceByFingerprint(fingerprint);
  } catch {
    // Pas d'ancien compte lié — on continue
  }

  await wipeDeviceForNewAccount();
  return fingerprint;
}
