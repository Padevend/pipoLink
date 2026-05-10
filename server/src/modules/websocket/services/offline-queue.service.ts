import { WsOutgoingEnvelope } from "../events/event-types.js";

export type OfflineEvent = WsOutgoingEnvelope & { userId: string };

export class OfflineQueueService {
  private queues = new Map<string, OfflineEvent[]>();
  private maxEvents = 200;

  enqueue(userId: string, event: WsOutgoingEnvelope) {
    const list = this.queues.get(userId) ?? [];
    list.push({ ...event, userId });
    if (list.length > this.maxEvents) list.splice(0, list.length - this.maxEvents);
    this.queues.set(userId, list);
  }

  drain(userId: string, lastEventId?: string | null): OfflineEvent[] {
    const list = this.queues.get(userId) ?? [];
    if (!lastEventId) return list.slice();
    const idx = list.findIndex((evt) => evt.eventId === lastEventId);
    if (idx === -1) return list.slice();
    return list.slice(idx + 1);
  }

  clear(userId: string) {
    this.queues.delete(userId);
  }
}
