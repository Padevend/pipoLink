import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { DecryptedMessage } from '@/features/messaging/hooks/use-messages';

export type MessageListItem =
  | { type: 'date'; id: string; label: string }
  | { type: 'message'; id: string; message: DecryptedMessage }
  | { type: 'unread-separator'; id: string };

function dateLabel(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return "Aujourd'hui";
  if (isYesterday(d)) return 'Hier';
  return format(d, 'EEEE d MMMM', { locale: fr });
}

export function groupMessagesByDate(messages: DecryptedMessage[], userId?: string): MessageListItem[] {
  const out: MessageListItem[] = [];
  let lastLabel = '';

  const firstUnreadIndex = messages.findIndex(
    (m) => m.sender_id !== userId && m.status !== 'read'
  );

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const label = dateLabel(m.created_at);
    if (label !== lastLabel) {
      out.push({ type: 'date', id: `date-${m.created_at.slice(0, 10)}`, label });
      lastLabel = label;
    }
    
    if (i === firstUnreadIndex) {
      out.push({ type: 'unread-separator', id: 'unread-separator' });
    }
    
    out.push({ type: 'message', id: m.id, message: m });
  }

  return out;
}
