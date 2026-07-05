import { useMutation, useQueryClient } from '@tanstack/react-query';

import { documentKeys, libraryKeys } from '@/entities/document/library-keys';
import { libraryApi, type PickedLibraryFile } from '@/shared/api/library';
import type { DocumentType } from '@/shared/api/types';
import { prependDocumentToLists } from '@/shared/lib/query-cache';
import { useToast } from '@/providers';

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
      showToast({
        type: 'success',
        message: `Fichier "${doc.title}" importé avec succès.`,
      });
    },
    onError: (err: any) => {
      console.error('[UploadDocument] failed:', err);
      showToast({
        type: 'error',
        message: err.message || "Échec de l'upload du document.",
      });
    },
  });
}
