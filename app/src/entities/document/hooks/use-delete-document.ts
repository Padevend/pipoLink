import { useMutation, useQueryClient } from '@tanstack/react-query';

import { documentKeys, libraryKeys } from '@/entities/document/library-keys';
import { libraryApi } from '@/shared/api/library';

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.deleteDocument,
    onSuccess: (_void, documentId) => {
      queryClient.removeQueries({ queryKey: libraryKeys.detail(documentId) });
      void queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
