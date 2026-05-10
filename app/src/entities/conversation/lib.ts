import type { ConversationModel } from './model';

export function sortConversations(conversations: ConversationModel[]): ConversationModel[] {
  return [...conversations].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return Number(right.isPinned) - Number(left.isPinned);
    }

    return right.lastMessageAt.localeCompare(left.lastMessageAt);
  });
}
