import { useQuery } from '@tanstack/react-query';

import { userApi, type SearchUserResult } from '@/shared/api/user';

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => userApi.searchUsers(query),
    enabled: true,
    staleTime: 30_000,
  });
}

export type { SearchUserResult };
