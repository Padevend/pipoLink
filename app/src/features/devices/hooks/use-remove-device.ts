import { useMutation } from '@tanstack/react-query';

import { devicesApi } from '@/shared/api/devices';
import { queryClient } from '@/providers';

export function useRemoveDevice() {
  return useMutation({
    mutationFn: (id: string) => devicesApi.removeDevice(id),
    onMutate: async (deviceId: string) => {
      await queryClient.cancelQueries({ queryKey: ['devices'] });
      const previous = queryClient.getQueryData(['devices']);
      queryClient.setQueryData(['devices'], (current: Array<{ id: string }> | undefined) =>
        current?.filter((device) => device.id !== deviceId),
      );
      return { previous };
    },
    onError: (_error, _deviceId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['devices'], context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
