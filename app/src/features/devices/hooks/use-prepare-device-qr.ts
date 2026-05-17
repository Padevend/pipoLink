import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { DeviceQrPayloadV2 } from '@/features/devices/lib/verify-qr-payload';
import { authApi } from '@/shared/api/auth';
import { generateIdentityKeys } from '@/shared/crypto/keys';
import { generateUUID } from '@/shared/utils/uuid';

/**
 * Appareil secondaire : génère clés + session d'appairage **sans authentification**.
 */
export function usePrepareDeviceQr() {
  return useMutation({
    mutationFn: async (): Promise<DeviceQrPayloadV2> => {
      const { publicKey, signature } = await generateIdentityKeys();

      let fingerprint = await SecureStore.getItemAsync('device_fingerprint');
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStore.setItemAsync('device_fingerprint', fingerprint);
      }

      const { token, shortCode } = await authApi.initiatePairing({
        deviceName: `${Platform.OS} device`,
        platform: Platform.OS,
        fingerprint,
        publicKey,
        keySignature: signature,
      });

      return {
        v: 2,
        token,
        shortCode,
        publicKey,
        keySignature: signature,
        deviceName: `${Platform.OS} device`,
        platform: Platform.OS,
        fingerprint,
      };
    },
  });
}
