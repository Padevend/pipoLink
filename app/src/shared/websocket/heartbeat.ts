let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(onTick: () => void, intervalMs = 30000): void {
  stopHeartbeat();
  heartbeatTimer = setInterval(onTick, intervalMs);
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
