import { useQuery } from '@tanstack/react-query';

import { libraryApi } from '@/shared/api/library';

export function useSearchDocuments(queryValue: string) {
  return useQuery({
    queryKey: ['document-search', queryValue],
    queryFn: () => libraryApi.getDocuments({ search: queryValue }),
    enabled: queryValue.trim().length > 0,
  });
}
