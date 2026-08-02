import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { DecryptedMessage } from '@/features/messaging/hooks/use-messages';

export type MessageListItem =
  | { type: 'date'; id: string; label: string }
  | { type: 'message'; id: string; message: DecryptedMessage }
  | { type: 'unread-separator'; id: string };

function dateLabel(iso?: string): string {
  if (!iso) return "Aujourd'hui";
  try {
    const d = parseISO(iso);
    if (isNaN(d.getTime())) return "Aujourd'hui";
    if (isToday(d)) return "Aujourd'hui";
    if (isYesterday(d)) return 'Hier';
    return format(d, 'EEEE d MMMM', { locale: fr });
  } catch {
    return "Aujourd'hui";
  }
}

export function groupMessagesByDate(messages: DecryptedMessage[], userId?: string): MessageListItem[] {
  const out: MessageListItem[] = [];
  let lastLabel = '';

  const firstUnreadIndex = messages.findIndex(
    (m) => m.sender_id !== userId && m.status !== 'read'
  );

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const safeCreatedAt = m.created_at || new Date().toISOString();
    const label = dateLabel(safeCreatedAt);
    if (label !== lastLabel) {
      const dateSlice = safeCreatedAt.length >= 10 ? safeCreatedAt.slice(0, 10) : `${i}`;
      out.push({ type: 'date', id: `date-${dateSlice}-${i}`, label });
      lastLabel = label;
    }
    
    if (i === firstUnreadIndex) {
      out.push({ type: 'unread-separator', id: 'unread-separator' });
    }
    
    out.push({ type: 'message', id: m.id, message: m });
  }

  return out;
}
