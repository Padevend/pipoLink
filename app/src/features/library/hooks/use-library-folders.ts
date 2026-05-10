import { useQuery } from '@tanstack/react-query';

import { libraryApi } from '@/shared/api/library';

export function useLibraryFolders(parentId: string | null) {
  return useQuery({
    queryKey: ['folders', parentId],
    queryFn: () => libraryApi.getFolders(parentId || undefined),
  });
}
