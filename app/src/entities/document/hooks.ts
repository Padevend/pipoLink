import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { libraryApi, type PickedLibraryFile } from '@/shared/api/library';
import { DocumentType } from '@/shared/api/types';
import { prependDocumentToLists } from '@/shared/lib/query-cache';

export const documentKeys = {
  all: ['documents'] as const,
  list: (params: unknown) => [...documentKeys.all, 'list', params] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
};

export const useDocuments = (params?: {
  filiere?: string;
  niveau?: string;
  ue?: string;
  type?: DocumentType;
  year?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: documentKeys.list(params ?? {}),
    queryFn: () => {
      console.log("fetching documents with params", params)
      return libraryApi.getDocuments(params)
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      metadata,
    }: {
      file: PickedLibraryFile;
      metadata: {
        title: string;
        type: DocumentType;
        filiere: string;
        niveau: string;
        ue: string;
        description?: string;
      };
    }) => libraryApi.uploadDocument(file, metadata),
    onSuccess: (doc) => {
      prependDocumentToLists(queryClient, doc);
    },
  });
};
