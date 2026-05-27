import { useQuery } from '@tanstack/react-query';
import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';

import { devicesApi } from '@/shared/api/devices';

export function useIsPrimaryDevice() {
  return useQuery({
    queryKey: ['devices', 'is-primary'],
    queryFn: async () => {
      const deviceId = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) return false;
      const devices = await devicesApi.getDevices();
      const current = devices.find((d) => d.id === deviceId);
      return current?.isPrimary ?? false;
    },
    staleTime: 60_000,
  });
}
