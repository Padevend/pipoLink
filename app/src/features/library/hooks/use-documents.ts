import { useQuery } from '@tanstack/react-query';

import { libraryApi } from '@/shared/api/library';

export function useDocuments(folderId: string) {
  return useQuery({
    queryKey: ['documents', folderId],
    queryFn: () => libraryApi.getDocuments({ folderId }),
  });
}
