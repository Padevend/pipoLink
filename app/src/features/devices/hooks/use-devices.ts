import { useQuery } from '@tanstack/react-query';
import { devicesApi } from '@/shared/api/devices';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.getDevices,
  });
}
