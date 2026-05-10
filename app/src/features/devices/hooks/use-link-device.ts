import { useMutation } from '@tanstack/react-query';
import { devicesApi } from '@/shared/api/devices';
import { queryClient } from '@/providers';
import { Platform } from 'react-native';

export function useLinkDevice() {
  return useMutation({
    mutationFn: (token: string) => devicesApi.verifyQr({
      token,
      deviceName: 'Mobile App',
      platform: Platform.OS,
      fingerprint: 'mock-fingerprint'
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
