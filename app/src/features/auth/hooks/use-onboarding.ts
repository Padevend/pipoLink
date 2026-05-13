import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { generateIdentityKeys } from '@/shared/crypto/keys';
import { userApi } from '@/shared/api/user';
import { generateUUID } from '@/shared/utils/uuid';

export function useOnboarding() {
  const queryClient = useQueryClient();

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
    }) => {
      let fingerprint = await SecureStore.getItemAsync('device_fingerprint');
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStore.setItemAsync('device_fingerprint', fingerprint);
      }

      const { publicKey, signature } = await generateIdentityKeys();

      const result = await userApi.completeOnboarding({
        ...profile,
        deviceName: `${Platform.OS} device`,
        devicePlatform: Platform.OS,
        deviceFingerprint: fingerprint,
        devicePublicKey: publicKey,
        deviceKeySignature: signature,
      });

      if (result.device?.id) {
        await SecureStore.setItemAsync('device_id', result.device.id);
      }

      if (result.user) {
        await SecureStore.setItemAsync('user_data', JSON.stringify(result.user));
      }

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
