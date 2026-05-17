import { useQuery } from '@tanstack/react-query';

import { libraryKeys } from '@/entities/document/library-keys';
import { libraryApi } from '@/shared/api/library';

export function useLibraryBrowse(parentId: string | null) {
  return useQuery({
    queryKey:  libraryKeys.browse(parentId),
    queryFn:   () => libraryApi.browse(parentId),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}
