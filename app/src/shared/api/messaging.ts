import { api } from './client';
import { Message, PaginatedResponse } from './types';

export interface Conversation {
  id: string;
  type?: 'private' | 'group';
  name?: string | null;
  avatarUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
  members: { id: string; username: string; avatarUrl?: string }[];
  updatedAt: string;
}

export const messagingApi = {
  getConversations: () => api.get<Conversation[]>('/messaging'),

  createChat: (body: {
    name?: string | null;
    type: 'private' | 'group';
    memberUserIds: string[];
    encryptedKeys: { deviceId: string; encryptedKey: string }[];
  }) => api.post<Conversation>('/messaging', body),

  addMember: (
    chatId: string,
    body: { userId: string; encryptedKeys: { deviceId: string; encryptedKey: string }[] },
  ) => api.post<Conversation>(`/messaging/${chatId}/members`, body),

  getMyEncryptedChatKey: (chatId: string, deviceId: string) =>
    api.get<{ encryptedChatKey: string }>(`/messaging/${chatId}/my-encrypted-key`, {
      params: { deviceId },
    }),

  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Message>>(`/messaging/${conversationId}/messages`, { params }),

  sendMessage: (
    conversationId: string,
    payload: {
      content: string;
      iv: string;
      type?: string;
      attachments?: { fileUrl: string; iv: string; fileName: string; fileSize: number; mimeType: string }[];
    },
  ) => api.post<Message>(`/messaging/${conversationId}/messages`, payload),

  uploadFile: (conversationId: string, formData: FormData) =>
    api.upload<{ url: string; size: number; fileName: string; mimeType: string }>(
      `/messaging/${conversationId}/messages/upload`,
      formData,
    ),

  uploadAttachment: (conversationId: string, formData: FormData) =>
    api.upload<{ url: string; size: number; fileName: string; mimeType: string }>(
      `/messaging/${conversationId}/messages/upload-attachment`,
      formData,
    ),

  markAsRead: (conversationId: string) => api.post<void>(`/messaging/${conversationId}/read`),
};
