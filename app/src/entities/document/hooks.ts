import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '@/shared/api/library';
import { DocumentType } from '@/shared/api/types';

export const documentKeys = {
  all: ['documents'] as const,
  list: (params: any) => [...documentKeys.all, 'list', params] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
};

export const useDocuments = (params?: { 
  folderId?: string; 
  type?: DocumentType; 
  niveau?: string; 
  year?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => libraryApi.getDocuments(params),
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, metadata }: { file: any; metadata: { title: string; type: DocumentType; folderId?: string } }) => 
      libraryApi.uploadDocument(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};
