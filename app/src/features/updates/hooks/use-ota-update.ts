import { useQuery } from '@tanstack/react-query';
import { updatesApi } from '@/shared/api/updates';

export function useOtaUpdate() {
  return useQuery({
    queryKey: ['update'],
    queryFn: updatesApi.checkUpdate,
  });
}
