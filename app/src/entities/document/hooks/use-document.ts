import { useQuery } from '@tanstack/react-query';

import { libraryKeys } from '@/entities/document/library-keys';
import { libraryApi } from '@/shared/api/library';

export function useDocument(documentId: string) {
  return useQuery({
    queryKey:  libraryKeys.detail(documentId),
    queryFn:   () => libraryApi.getDocument(documentId),
    staleTime: 5 * 60_000,
    enabled:   Boolean(documentId),
  });
}
