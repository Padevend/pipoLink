import { useMutation, useQueryClient } from '@tanstack/react-query';

import { documentKeys, libraryKeys } from '@/entities/document/library-keys';
import { libraryApi, type PickedLibraryFile } from '@/shared/api/library';
import type { DocumentType } from '@/shared/api/types';
import { prependDocumentToLists } from '@/shared/lib/query-cache';

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      file: PickedLibraryFile;
      metadata: {
        title: string;
        type: DocumentType;
        filiere: string;
        niveau: string;
        ue: string;
        description?: string;
      };
    }) => libraryApi.uploadDocument(payload.file, payload.metadata),
    onSuccess: (doc) => {
      prependDocumentToLists(queryClient, doc);
      void queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      void queryClient.invalidateQueries({ queryKey: libraryKeys.mine({ limit: 30 }) });
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
