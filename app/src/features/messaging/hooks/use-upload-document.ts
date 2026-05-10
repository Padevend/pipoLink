import { useMutation } from '@tanstack/react-query';

import { libraryApi } from '@/shared/api/library';

export function useUploadDocument() {
  return useMutation({
    mutationFn: async (payload: {
      file: any;
      folderId?: string;
      title: string;
      type: 'CC' | 'TD' | 'TP' | 'Examen' | 'Cours' | 'Résumé';
      niveau: string;
      ue: string;
      annee: number;
      description?: string;
      fileName: string;
      fileSize: number;
    }) =>
      libraryApi.uploadDocument(payload.file, {
        folderId: payload.folderId,
        title: payload.title,
        type: payload.type as any, // DocumentType
      }),
  });
}
