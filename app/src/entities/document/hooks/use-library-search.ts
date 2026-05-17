import { useQuery } from '@tanstack/react-query';

import { libraryKeys } from '@/entities/document/library-keys';
import { libraryApi } from '@/shared/api/library';

export function useLibrarySearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey:  libraryKeys.search(trimmed),
    queryFn:   () => libraryApi.searchDocuments(trimmed),
    enabled:   trimmed.length >= 2,
    staleTime: 30_000,
  });
}
