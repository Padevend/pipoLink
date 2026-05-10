type QueueItem = {
  event: string;
  payload: unknown;
};

const queue: QueueItem[] = [];

export function enqueueEvent(event: string, payload: unknown): void {
  queue.push({ event, payload });
}

export function flushQueuedEvents(): QueueItem[] {
  return queue.splice(0, queue.length);
}

export function hasQueuedEvents(): boolean {
  return queue.length > 0;
}
