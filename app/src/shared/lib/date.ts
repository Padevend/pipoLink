export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

export function formatRelativeDate(value: string): string {
  const input = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - input.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Aujourd’hui';
  }
  if (diffDays === 1) {
    return 'Hier';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(input);
}
