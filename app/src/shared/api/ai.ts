import { api } from './client';
import type { Document } from './types';

export interface AiTokenStatus {
  tokens: number;
  maxTokens: number;
  plan: string;
  windowHours: number;
  lastTokenRestorationAt: string;
  nextRestorationAt: string | null;
  timeRemainingMs: number;
}

export interface AiTokenStatus {
  tokens: number;
  maxTokens: number;
  plan: string;
  windowHours: number;
  lastTokenRestorationAt: string;
  nextRestorationAt: string | null;
  timeRemainingMs: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: 'send' | 'delivered' | 'read' | 'fail';
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
   * Get AI token status (balance, window, remaining time)
   */
  getTokenStatus: () =>
    api.get<AiTokenStatus>('/ai/tokens'),

  /**
   * Send a message to the AI
   */
  sendMessage: (
    payload: { message: string; sessionId?: string },
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ) =>
    api.post<{ session: AiSession; message: AiChatMessage; request: AiChatMessage; tokens?: AiTokenStatus }>(
      '/ai/chat',
      payload,
      { timeoutMs: 60_000, ...options }
    ),

  /**
   * List AI chat sessions
   */
  getSessions: () =>
    api.get<AiSession[]>('/ai/sessions'),

  /**
   * Create a new AI session (notebook) with a title and optional document IDs
   */
  createSession: (payload: { title: string; documentIds?: string[] }) =>
    api.post<{ session: AiSession }>('/ai/sessions', payload),

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
   * Truncate messages in session starting from or after messageId
   */
  truncateMessages: (sessionId: string, messageId: string, inclusive = true) =>
    api.post<void>(`/ai/sessions/${sessionId}/messages/${messageId}/truncate`, { inclusive }),

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
  generateStudyAid: (
    sessionId: string,
    type: string,
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ) =>
    api.post<{ message: AiChatMessage }>(
      `/ai/sessions/${sessionId}/generate`,
      { type },
      { timeoutMs: 90_000, ...options }
    ),

  /**
   * Get private AI attachments
   */
  getAttachments: () =>
    api.get<Document[]>('/ia/attachments'),

  /**
   * Upload private AI attachment
   */
  uploadAttachment: async (
    file: { uri: string; name: string; mimeType: string; size?: number },
    metadata: {
      title: string;
      type: string;
      filiere: string;
      niveau: string;
      ue: string;
      description?: string;
    },
  ) => {
    const formData = new FormData();
    // @ts-expect-error React Native FormData file blob
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/octet-stream",
    });
    formData.append(
      "payload",
      JSON.stringify({
        title: metadata.title,
        type: metadata.type,
        filiere: metadata.filiere,
        niveau: metadata.niveau,
        ue: metadata.ue,
        description: metadata.description,
      }),
    );

    return api.upload<Document>("/ia/upload-attachment", formData);
  },

  /**
   * Delete private AI attachment
   */
  deleteAttachment: (id: string) =>
    api.delete<void>(`/ia/attachments/${id}`),
};
