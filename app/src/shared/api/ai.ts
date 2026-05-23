import { api } from './client';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiSessionResponse {
  createdAt: string,
  id: string,
  messages: AiChatMessage[],
  title: string,
  updatedAt: string,
  user_id: string
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
};
