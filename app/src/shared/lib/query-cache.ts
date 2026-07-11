import type { QueryClient } from '@tanstack/react-query';

import { normalizeConversation, type RawConversation } from '@/shared/api/normalize-conversation';
import type { Conversation } from '@/shared/api/messaging';
import type { Document, PaginatedResponse } from '@/shared/api/types';
import { mergeUserProfile, normalizeUser, type UserWithProfile } from '@/shared/api/normalize-user';
import type { UserProfile } from '@/shared/api/types';
import { userKeys } from '@/entities/user/keys';
import { documentKeys } from '@/entities/document/library-keys';
import { conversationKeys } from '@/entities/conversation/hooks';

export function setCurrentUser(queryClient: QueryClient, user: UserWithProfile): void {
  queryClient.setQueryData(userKeys.me(), user);
}

export function patchCurrentUserProfile(
  queryClient: QueryClient,
  patch: Partial<UserProfile>,
): void {
  queryClient.setQueryData<UserWithProfile | undefined>(userKeys.me(), (prev) =>
    prev ? mergeUserProfile(prev, patch) : prev,
  );
}

export function patchCurrentUserAvatar(queryClient: QueryClient, avatarUrl: string): void {
  patchCurrentUserProfile(queryClient, { avatarUrl });
}

export function prependDocumentToLists(queryClient: QueryClient, doc: Document): void {
  queryClient.setQueriesData<PaginatedResponse<Document>>(
    { queryKey: documentKeys.all },
    (prev) => {
      if (!prev?.items) return prev;
      if (prev.items.some((d) => d.id === doc.id)) return prev;
      return { ...prev, items: [doc, ...prev.items], total: prev.total + 1 };
    },
  );
}

export function upsertConversationInList(queryClient: QueryClient, raw: RawConversation): void {
  const conversation = normalizeConversation(raw);
  queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (prev) => {
    const list = prev ?? [];
    const idx = list.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = { ...next[idx], ...conversation };
      return next;
    }
    return [conversation, ...list];
  });
}
