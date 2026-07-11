import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SecureStorageService, AsyncStorageService, SECURE_STORAGE_KEYS, ASYNC_STORAGE_KEYS } from '@/shared/lib/storage';
import { Platform } from 'react-native';

import { useAuth } from '@/providers';
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
      let fingerprint = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT);
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
      }

      try {
        await authApi.detachDeviceByFingerprint(fingerprint);
      } catch {
        // aucun ancien compte
      }

      await wipeDeviceForNewAccount();

      const { publicKey, signature } = await generateIdentityKeys({ forceNew: true });

      try {
        const tempPassword = await SecureStorageService.get('temp_login_password');
        if (tempPassword) {
          const { createKeyBackup } = await import('@/shared/crypto/backup');
          const backup = await createKeyBackup(tempPassword);
          if (backup) {
            await authApi.backupKey(backup);
          }
        }
      } catch (err) {
        console.error('Silent key backup upload failed during onboarding:', err);
      }

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
        await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_ID, result.device.id);
      }

      if (result.user) {
        await AsyncStorageService.set(ASYNC_STORAGE_KEYS.USER_DATA, result.user);
      }

      return result;
    },
    onSuccess: async (result) => {
      const basicUser = normalizeUser(result.user);
      await signInWithTokens(
        {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.tokens.expiresAt,
          deviceId: result.device?.id,
        },
        basicUser,
      );
      const fullUser = await userApi.getMe().catch(() => basicUser);
      setCurrentUser(queryClient, fullUser);
    },
  });
}
