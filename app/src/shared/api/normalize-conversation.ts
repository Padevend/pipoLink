import type { Conversation } from '@/shared/api/messaging';
import type { Message } from '@/shared/api/types';

type RawMember = {
    id: string,
    username: string,
    avatarUrl?: string | undefined,
    phone?: string | undefined
};

export type RawConversation = Partial<Conversation> & {
  updated_at?: string | Date;
  unread_count?: number;
  members?: RawMember[];
};

export function normalizeConversation(raw: RawConversation): Conversation {
  const members = ((raw.members ?? []) as RawMember[]).map((m) => {
    return {
      id: m.id,
      username: m.username,
      avatarUrl: m.avatarUrl,
      phone: m.phone
    }
  });

  const updatedAtRaw = raw.updatedAt ?? raw.updated_at;
  const updatedAt =
    updatedAtRaw instanceof Date
      ? updatedAtRaw.toISOString()
      : typeof updatedAtRaw === 'string' && updatedAtRaw
        ? updatedAtRaw
        : new Date().toISOString();

  const unreadRaw = raw.unreadCount ?? raw.unread_count ?? 0;
  const unreadCount = Number.isFinite(Number(unreadRaw)) ? Number(unreadRaw) : 0;

  const name =
    raw.name ??
    (raw.type === 'private' ? members.map((m) => m.username).filter(Boolean).join(', ') || null : null);

  return {
    id: raw.id ?? '',
    type: raw.type,
    name,
    avatarUrl: raw.avatarUrl,
    lastMessage: raw.lastMessage as Message | undefined,
    unreadCount,
    members,
    updatedAt,
  };
}
