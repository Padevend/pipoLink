import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { DeviceQrPayloadV1 } from '@/features/devices/lib/verify-qr-payload';
import { authApi } from '@/shared/api/auth';
import { generateIdentityKeys } from '@/shared/crypto/keys';
import { generateUUID } from '@/shared/utils/uuid';

/**
 * Côté **nouvel appareil** : génère les clés + token serveur pour construire le payload affiché / partagé en QR.
 */
export function usePrepareDeviceQr() {
  return useMutation({
    mutationFn: async (): Promise<DeviceQrPayloadV1> => {
      const { publicKey, signature } = await generateIdentityKeys();

      let fingerprint = await SecureStore.getItemAsync('device_fingerprint');
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStore.setItemAsync('device_fingerprint', fingerprint);
      }

      const { token } = await authApi.generateQr();

      return {
        v: 1,
        token,
        publicKey,
        keySignature: signature,
        deviceName: `${Platform.OS} device`,
        platform: Platform.OS,
        fingerprint,
      };
    },
  });
}
