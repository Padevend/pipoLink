import { WsEventNameType } from "../events/event-names.js";

export type EmitTarget = {
  userId?: string;
  conversationId?: string;
  deviceId?: string;
  excludeConnectionId?: string;
};

export type RealtimeEmitter = {
  emit(event: WsEventNameType, payload: unknown, target: EmitTarget): void;
  addUserToConversationRoom(userId: string, conversationId: string): void;
};

class RealtimeBusImpl {
  private emitter?: RealtimeEmitter;

  setEmitter(emitter: RealtimeEmitter) {
    this.emitter = emitter;
  }

  emit(event: WsEventNameType, payload: unknown, target: EmitTarget) {
    if (!this.emitter) return;
    this.emitter.emit(event, payload, target);
  }

  addUserToConversationRoom(userId: string, conversationId: string) {
    if (!this.emitter) return;
    this.emitter.addUserToConversationRoom(userId, conversationId);
  }
}

export const RealtimeBus = new RealtimeBusImpl();
