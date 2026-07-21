import { useQuery } from '@tanstack/react-query';

import { documentKeys } from '@/entities/document/library-keys';
import { libraryApi } from '@/shared/api/library';
import { DocumentType } from '@/shared/api/types';

export { documentKeys, libraryKeys } from '@/entities/document/library-keys';
export {
  useDocument,
  useLibraryBrowse,
  useLibrarySearch,
  useMyDocuments,
  useDeleteDocument,
  useUploadDocument,
  useSemanticSearch,
} from './hooks/index';

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
    queryFn:  () => libraryApi.getDocuments(params),
  });
};
