import { api } from './client';
import { Document, DocumentType, PaginatedResponse } from './types';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export const libraryApi = {
  /**
   * List documents with filters
   */
  getDocuments: (params?: { 
    folderId?: string; 
    type?: DocumentType; 
    niveau?: string; 
    year?: number;
    search?: string;
  }) => 
    api.get<PaginatedResponse<Document>>('/library/documents', { params }),

  /**
   * Get document by ID
   */
  getDocument: (id: string) => 
    api.get<Document>(`/library/documents/${id}`),

  /**
   * Get document download URL
   */
  downloadDocument: (id: string) => 
    api.get<{ fileUrl: string }>(`/library/documents/${id}/download`),

  /**
   * Upload a document
   */
  uploadDocument: (file: any, metadata: { title: string; folderId?: string; type: DocumentType }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('payload', JSON.stringify(metadata));
    return api.upload<Document>('/library/documents', formData);
  },

  /**
   * List folders
   */
  getFolders: (parentId?: string) => 
    api.get<Folder[]>('/library/folders', { params: { parentId } }),

  /**
   * Create a folder
   */
  createFolder: (name: string, parentId?: string) => 
    api.post<Folder>('/library/folders', { name, parentId }),

  /**
   * Delete a document
   */
  deleteDocument: (id: string) => 
    api.delete<void>(`/library/documents/${id}`),

  /**
   * Update a document metadata
   */
  updateDocument: (id: string, metadata: Partial<Document>) => 
    api.put<Document>(`/library/documents/${id}`, metadata),

  /**
   * Moderate a document
   */
  moderateDocument: (id: string, payload: { decision: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) => 
    api.post<void>(`/library/documents/${id}/moderate`, payload),
};
