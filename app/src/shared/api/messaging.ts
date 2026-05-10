import { api } from './client';
import { Message, PaginatedResponse } from './types';

export interface Conversation {
  id: string;
  name?: string;
  avatarUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
  members: { id: string; username: string; avatarUrl?: string }[];
  updatedAt: string;
}

export const messagingApi = {
  /**
   * List conversations
   */
  getConversations: () => 
    api.get<Conversation[]>('/messaging'),

  /**
   * Create a new conversation
   */
  createConversation: (memberIds: string[]) => 
    api.post<{ id: string }>('/messaging', { memberIds }),

  /**
   * List messages in a conversation
   */
  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) => 
    api.get<PaginatedResponse<Message>>(`/messaging/${conversationId}/messages`, { params }),

  /**
   * Send a message (REST fallback)
   */
  sendMessage: (conversationId: string, payload: { content: string; iv: string; type?: string }) => 
    api.post<void>(`/messaging/${conversationId}/messages`, payload),

  /**
   * Upload a file to a conversation
   */
  uploadFile: (conversationId: string, formData: FormData) => 
    api.upload<{ url: string; size: number; fileName: string; mimeType: string }>(`/messaging/${conversationId}/messages/upload`, formData),

  /**
   * Mark messages as read
   */
  markAsRead: (conversationId: string) => 
    api.post<void>(`/messaging/${conversationId}/read`),
};
