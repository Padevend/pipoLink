import { useQuery } from '@tanstack/react-query';
import { UpdateManager } from '@/processes/update-manager';

export function useOtaUpdate() {
  return useQuery({
    queryKey: ['update'],
    queryFn: () => UpdateManager.manualCheck(),
  });
}
