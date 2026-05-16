import { useQuery } from '@tanstack/react-query';

import { authApi } from '@/shared/api/auth';
import type { User } from '@/shared/api/types';

export type DeviceLinkPollResult = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  deviceId: string | null;
  user: User;
  device: { id: string; name: string; platform: string };
};

/**
 * Côté **nouvel appareil** : attend que l'appareil principal valide le QR (agent.md §10, phase 4).
 */
export function useAwaitDeviceLink(qrToken: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['qr-link-poll', qrToken],
    queryFn: async (): Promise<DeviceLinkPollResult | null> => {
      if (!qrToken) return null;
      const res = await authApi.pollQrLink(qrToken);
      if (res.status !== 'completed' || !res.tokens) return null;
      return res.tokens;
    },
    enabled: Boolean(qrToken && enabled),
    refetchInterval: (query) => (query.state.data ? false : 2000),
    retry: false,
  });
}
