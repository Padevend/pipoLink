import { useMutation } from '@tanstack/react-query';

import { libraryApi } from '@/shared/api/library';
import { queryClient } from '@/providers';

export function useDeleteDocument(folderId: string) {
  return useMutation({
    mutationFn: libraryApi.deleteDocument,
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['documents', folderId] });
      const previous = queryClient.getQueryData(['documents', folderId]);
      queryClient.setQueryData(['documents', folderId], (current: { id: string }[] | undefined) =>
        current?.filter((document) => document.id !== documentId),
      );
      return { previous };
    },
    onError: (_error, _documentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['documents', folderId], context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents', folderId] });
    },
  });
}
