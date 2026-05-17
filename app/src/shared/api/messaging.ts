import { api, requestPaginated } from './client';
import { normalizeConversation, type RawConversation } from './normalize-conversation';
import { normalizeMessage, type RawMessage } from './normalize-message';
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
  getConversations: async (): Promise<Conversation[]> => {
    const raw = await api.get<RawConversation[]>('/messaging');
    return (raw ?? []).map(normalizeConversation);
  },

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

  getMessages: async (
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<Message>> => {
    const page = await requestPaginated<RawMessage>(`/messaging/${conversationId}/messages`, {
      params,
    });
    return {
      ...page,
      items: page.items.map(normalizeMessage),
    };
  },

  sendMessage: (
    conversationId: string,
    payload: {
      content: string;
      iv: string;
      type?: string;
      attachments?: { fileUrl: string; iv: string; fileName: string; fileSize: number; mimeType: string }[];
    },
  ) => api.post<RawMessage>(`/messaging/${conversationId}/messages`, payload).then(normalizeMessage),

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
