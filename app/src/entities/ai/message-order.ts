import type { AiChatMessage } from '@/shared/api/ai';

/** Keeps optimistic and server messages in one deterministic chronological order. */
export function sortAiMessages(messages: AiChatMessage[]): AiChatMessage[] {
  return [...messages].sort((a, b) => {
    const timeA = Date.parse(a.createdAt) || 0;
    const timeB = Date.parse(b.createdAt) || 0;
    if (timeA !== timeB) return timeA - timeB;
    const orderA = a.clientOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.clientOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });
}

export function mergeAiMessages(current: AiChatMessage[], incoming: AiChatMessage[]): AiChatMessage[] {
  const byId = new Map<string, AiChatMessage>();
  for (const message of [...current, ...incoming]) {
    byId.set(message.id, { ...byId.get(message.id), ...message });
  }
  return sortAiMessages([...byId.values()]);
}
