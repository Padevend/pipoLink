import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { useAuth } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { generateUUID } from '@/shared/utils/uuid';

export function useLoginUsername() {
  const { signInWithTokens } = useAuth();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      let fingerprint = await SecureStore.getItemAsync('device_fingerprint');
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStore.setItemAsync('device_fingerprint', fingerprint);
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
