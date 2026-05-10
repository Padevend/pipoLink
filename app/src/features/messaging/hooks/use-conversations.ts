import { useQuery } from '@tanstack/react-query';

import { messagingApi } from '@/shared/api/messaging';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: messagingApi.getConversations,
    staleTime: 2 * 60 * 1000,
  });
}
