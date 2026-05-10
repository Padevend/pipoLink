import { formatTime } from '@/shared/lib/date';

export function getMessageTime(value: string): string {
  return formatTime(value);
}
