export type EventHandler<T = unknown> = (payload: T) => void;

class InternalEmitter {
  private readonly listeners = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    const handlers = this.listeners.get(event) ?? new Set<EventHandler>();
    handlers.add(handler as EventHandler);
    this.listeners.set(event, handlers);

    return () => {
      handlers.delete(handler as EventHandler);
    };
  }

  emit<T>(event: string, payload: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => handler(payload));
  }
}

export const emitter = new InternalEmitter();
