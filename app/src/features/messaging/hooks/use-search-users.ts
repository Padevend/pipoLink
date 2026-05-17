import { useQuery } from '@tanstack/react-query';

import { userApi, type SearchUserResult } from '@/shared/api/user';

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => userApi.searchUsers(query),
    enabled: query.trim().length >= 1,
    staleTime: 30_000,
  });
}

export type { SearchUserResult };
