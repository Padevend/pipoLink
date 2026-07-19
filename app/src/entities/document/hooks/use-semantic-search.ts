import { useMutation } from '@tanstack/react-query';

import { libraryApi } from '@/shared/api/library';

export function useSemanticSearch() {
  return useMutation({
    mutationFn: (query: string) => libraryApi.semanticSearch(query),
  });
}
