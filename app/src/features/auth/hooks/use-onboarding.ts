import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { useAuth } from '@/providers';
import { queryClient } from '@/providers/query-provider';
import { authApi } from '@/shared/api/auth';
import { normalizeUser } from '@/shared/api/normalize-user';
import { userApi } from '@/shared/api/user';
import { setCurrentUser } from '@/shared/lib/query-cache';
import { generateIdentityKeys } from '@/shared/crypto/keys';
import { wipeDeviceForNewAccount } from '@/shared/crypto/reset-device';
import { generateUUID } from '@/shared/utils/uuid';

export function useOnboarding() {
  const queryClient = useQueryClient();
  const { signInWithTokens } = useAuth();

  return useMutation({
    mutationFn: async (profile: {
      firstname: string;
      lastname: string;
      username?: string;
      phone?: string;
      gender?: string;
      matricule?: string;
      niveau?: string;
      filiere?: string;
      bio?: string;
      avatarUri?: string | null;
    }) => {
      let fingerprint = await SecureStore.getItemAsync('device_fingerprint');
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStore.setItemAsync('device_fingerprint', fingerprint);
      }

      try {
        await authApi.detachDeviceByFingerprint(fingerprint);
      } catch {
        // aucun ancien compte
      }

      await wipeDeviceForNewAccount();

      const { publicKey, signature } = await generateIdentityKeys({ forceNew: true });

      const { avatarUri, ...rest } = profile;
      const result = await userApi.completeOnboarding({
        ...rest,
        deviceName: `${Platform.OS} device`,
        devicePlatform: Platform.OS,
        deviceFingerprint: fingerprint,
        devicePublicKey: publicKey,
        deviceKeySignature: signature,
      });

      if (avatarUri) {
        await userApi.uploadAvatar(avatarUri);
      }

      if (result.device?.id) {
        await SecureStore.setItemAsync('device_id', result.device.id);
      }

      if (result.user) {
        await SecureStore.setItemAsync('user_data', JSON.stringify(result.user));
      }

      return result;
    },
    onSuccess: async (result) => {
      const fullUser = await userApi.getMe().catch(() => normalizeUser(result.user));
      setCurrentUser(queryClient, fullUser);
      await signInWithTokens(
        {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.tokens.expiresAt,
          deviceId: result.device?.id,
        },
        fullUser,
      );
    },
  });
}
