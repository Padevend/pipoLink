export interface ConversationModel {
  id: string;
  type: 'direct' | 'group' | 'announcement';
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isPinned: boolean;
  participants: Array<{ id: string; username: string; avatarUrl?: string }>;
}
