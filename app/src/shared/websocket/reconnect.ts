export function getReconnectDelay(attempt: number): number {
  if (attempt <= 0) {
    return 1000;
  }

  if (attempt === 1) {
    return 1000;
  }
  if (attempt === 2) {
    return 2000;
  }
  if (attempt === 3) {
    return 4000;
  }
  if (attempt === 4) {
    return 8000;
  }

  return 30000;
}
