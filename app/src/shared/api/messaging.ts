import { api, requestPaginated } from "./client";
import {
  normalizeConversation,
  type RawConversation,
} from "./normalize-conversation";
import { normalizeMessage, type RawMessage } from "./normalize-message";
import { Message, PaginatedResponse } from "./types";

export interface Conversation {
  id: string;
  type?: "private" | "group";
  name?: string | null;
  avatarUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
  members: {
    id: string;
    username: string;
    avatarUrl?: string;
    phone?: string | undefined;
    role?: "admin" | "member";
    accountRole?: "admin" | "staff" | "student";
  }[];
  updatedAt: string;
  isPending?: boolean;
  recipientUserId?: string;
  created_by_id?: string;
}

export const messagingApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const raw = await api.get<RawConversation[]>("/messaging");
    return (raw ?? []).map(normalizeConversation);
  },

  createChat: (body: {
    name?: string | null;
    type: "private" | "group";
    memberUserIds: string[];
    encryptedKeys: { deviceId: string; encryptedKey: string }[];
  }) => api.post<Conversation>("/messaging", body),

  addMember: (
    chatId: string,
    body: {
      userId: string;
      encryptedKeys: { deviceId: string; encryptedKey: string }[];
    },
  ) => api.post<Conversation>(`/messaging/${chatId}/members`, body),

  getMyEncryptedChatKey: (chatId: string, deviceId: string) =>
    api.get<{ encryptedChatKey: string }>(
      `/messaging/${chatId}/my-encrypted-key`,
      {
        params: { deviceId },
      },
    ),

  getMessages: async (
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<Message>> => {
    const page = await requestPaginated<RawMessage>(
      `/messaging/${conversationId}/messages`,
      {
        params,
      },
    );
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
      replyToId?: string;
      attachments?: {
        fileUrl: string;
        iv: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
      }[];
    },
  ) =>
    api
      .post<RawMessage>(`/messaging/${conversationId}/messages`, payload)
      .then(normalizeMessage),

  uploadFile: (conversationId: string, formData: FormData) =>
    api.upload<{
      url: string;
      size: number;
      fileName: string;
      mimeType: string;
    }>(`/messaging/${conversationId}/messages/upload`, formData),

  uploadAttachment: (conversationId: string, formData: FormData) =>
    api.upload<{
      url: string;
      size: number;
      fileName: string;
      mimeType: string;
    }>(`/messaging/${conversationId}/messages/upload-attachment`, formData),

  markAsRead: (conversationId: string) =>
    api.post<void>(`/messaging/${conversationId}/read`),

  deleteMessage: (conversationId: string, messageId: string) =>
    api.delete<void>(`/messaging/${conversationId}/messages/${messageId}`),

  leaveGroup: (conversationId: string) =>
    api.post<void>(`/messaging/${conversationId}/leave`),

  deleteChat: (conversationId: string) =>
    api.delete<void>(`/messaging/${conversationId}`),

  updateChatDetails: (chatId: string, body: { name: string }) =>
    api.put<Conversation>(`/messaging/${chatId}`, body),

  promoteMember: (chatId: string, targetUserId: string) =>
    api.post<any>(`/messaging/${chatId}/members/promote`, { targetUserId }),

  demoteMember: (chatId: string, targetUserId: string) =>
    api.post<any>(`/messaging/${chatId}/members/demote`, { targetUserId }),

  kickMember: (chatId: string, targetUserId: string) =>
    api.post<any>(`/messaging/${chatId}/members/kick`, { targetUserId }),

  createInvitation: (
    chatId: string,
    body: { maxUses?: number; expiresAt?: string; encryptedChatKey?: string },
  ) => api.post<any>(`/messaging/${chatId}/invitations`, body),

  listInvitations: (chatId: string) =>
    api.get<any[]>(`/messaging/${chatId}/invitations`),

  getInvitationDetails: (token: string) =>
    api.get<any>(`/messaging/invitations/${token}`),

  joinViaInvitation: (
    token: string,
    body: { encryptedKeys: { deviceId: string; encryptedKey: string }[] },
  ) => api.post<Conversation>(`/messaging/invitations/${token}/join`, body),

  revokeInvitation: (invitationId: string) =>
    api.post<any>(`/messaging/invitations/${invitationId}/revoke`),
};
