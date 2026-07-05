import { api } from './client';
import type { Document } from './types';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiSessionResponse {
  createdAt: string;
  id: string;
  messages: AiChatMessage[];
  documents?: Document[];
  title: string;
  updatedAt: string;
  user_id: string;
}

export interface AiSession {
  id: string;
  title: string;
  createdAt: string;
}

export const aiApi = {
  /**
   * Send a message to the AI
   */
  sendMessage: (payload: { message: string; sessionId?: string }) =>
    api.post<{ session: AiSession; message: AiChatMessage, request: AiChatMessage }>('/ai/chat', payload),

  /**
   * List AI chat sessions
   */
  getSessions: () =>
    api.get<AiSession[]>('/ai/sessions'),

  /**
   * Get history for a session
   */
  getSessionHistory: (sessionId: string) =>
    api.get<AiSessionResponse>(`/ai/sessions/${sessionId}`),

  /**
   * Delete all AI sessions
   */
  deleteSessions: (sessionId: string) =>
    api.delete<void>(`/ai/sessions/${sessionId}`),

  /**
   * Get documents associated with a session
   */
  getSessionDocuments: (sessionId: string) =>
    api.get<Document[]>(`/ai/sessions/${sessionId}/documents`),

  /**
   * Add a document to a session
   */
  addDocumentToSession: (sessionId: string, documentId: string) =>
    api.post<Document[]>(`/ai/sessions/${sessionId}/documents`, { documentId }),

  /**
   * Remove a document from a session
   */
  removeDocumentFromSession: (sessionId: string, documentId: string) =>
    api.delete<void>(`/ai/sessions/${sessionId}/documents/${documentId}`),

  /**
   * Generate study aids (summary, faq, quiz, etc.)
   */
  generateStudyAid: (sessionId: string, type: string) =>
    api.post<{ message: AiChatMessage }>(`/ai/sessions/${sessionId}/generate`, { type }),
};
