import { useInfiniteQuery } from '@tanstack/react-query';

import { libraryKeys } from '@/entities/document/library-keys';
import { libraryApi } from '@/shared/api/library';

const PAGE_SIZE = 30;

export function useMyDocuments() {
  return useInfiniteQuery({
    queryKey: libraryKeys.mine({ limit: PAGE_SIZE }),
    queryFn:  ({ pageParam }) =>
      libraryApi.getMyDocuments({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 60_000,
  });
}
