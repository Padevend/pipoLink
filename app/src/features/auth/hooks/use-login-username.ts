import { useMutation } from '@tanstack/react-query';
import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';
import { Platform } from 'react-native';

import { useAuth } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { generateUUID } from '@/shared/utils/uuid';

export function useLoginUsername() {
  const { signInWithTokens } = useAuth();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      let fingerprint = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT);
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
      }
      return authApi.login({
        email: username,
        password,
        deviceFingerprint: fingerprint,
        deviceName: `${Platform.OS} device`,
        devicePlatform: Platform.OS,
      });
    },
    onSuccess: async (result) => {
      await signInWithTokens(
        {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
          deviceId: result.deviceId,
        },
        result.user,
      );
    },
  });
}
