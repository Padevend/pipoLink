import { api, requestPaginated } from './client';
import { Document, DocumentType } from './types';

export type PickedLibraryFile = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

function toUploadFile(file: PickedLibraryFile): { uri: string; name: string; type: string } {
  return {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  };
}

export const libraryApi = {
  getDocuments: (params?: {
    filiere?: string;
    niveau?: string;
    ue?: string;
    type?: DocumentType;
    year?: number;
    search?: string;
  }) => {
    return requestPaginated<Document>('/library/documents', { params })
  },

  getDocument: (id: string) => api.get<Document>(`/library/documents/${id}`),

  downloadDocument: (id: string) => api.get<{ fileUrl: string }>(`/library/documents/${id}/download`),

  uploadDocument: async (
    file: PickedLibraryFile,
    metadata: {
      title: string;
      type: DocumentType;
      filiere: string;
      niveau: string;
      ue: string;
      description?: string;
    },
  ) => {
    const formData = new FormData();
    // @ts-expect-error React Native FormData file blob
    formData.append('file', toUploadFile(file));
    formData.append(
      'payload',
      JSON.stringify({
        title: metadata.title,
        type: metadata.type,
        filiere: metadata.filiere,
        niveau: metadata.niveau,
        ue: metadata.ue,
        description: metadata.description,
      }),
    );
    return api.upload<Document>('/library/documents', formData);
  },

  deleteDocument: (id: string) => api.delete<void>(`/library/documents/${id}`),

  updateDocument: (id: string, metadata: Partial<Document>) =>
    api.put<Document>(`/library/documents/${id}`, metadata),

  moderateDocument: (
    id: string,
    payload: { decision: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
  ) => api.post<void>(`/library/documents/${id}/moderate`, payload),
};
