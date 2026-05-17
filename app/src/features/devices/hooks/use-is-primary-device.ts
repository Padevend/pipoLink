import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { devicesApi } from '@/shared/api/devices';

export function useIsPrimaryDevice() {
  return useQuery({
    queryKey: ['devices', 'is-primary'],
    queryFn: async () => {
      const deviceId = await SecureStore.getItemAsync('device_id');
      if (!deviceId) return false;
      const devices = await devicesApi.getDevices();
      const current = devices.find((d) => d.id === deviceId);
      return current?.isPrimary ?? false;
    },
    staleTime: 60_000,
  });
}
