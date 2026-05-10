import { WsEventName } from "../events/event-names.js";
import type { WebSocketGateway } from "../gateway/websocket-gateway.js";
import { handleAuthInit, handleAuthRefresh, handleSyncResume, handleSystemPing } from "./system.handler.js";
import { handleMessageSend, handleMessageUpdate, handleMessageDelete, handleMessageDelivered, handleMessageRead } from "./message.handler.js";
import { handleTypingStarted, handleTypingStopped } from "./typing.handler.js";
import { handleConversationCreate, handleConversationUpdate } from "./conversation.handler.js";
import { handlePresenceUpdate } from "./presence.handler.js";

export type HandlerContext = {
  gateway: WebSocketGateway;
  connectionId: string;
};

export type Handler = (ctx: HandlerContext, payload: unknown, requestId?: string) => Promise<void>;

export function createHandlers(): Record<string, Handler> {
  return {
    [WsEventName.AuthInit]: handleAuthInit,
    [WsEventName.AuthRefresh]: handleAuthRefresh,
    [WsEventName.SyncResume]: handleSyncResume,
    [WsEventName.SystemPing]: handleSystemPing,
    [WsEventName.MessageSend]: handleMessageSend,
    [WsEventName.MessageUpdate]: handleMessageUpdate,
    [WsEventName.MessageDelete]: handleMessageDelete,
    [WsEventName.MessageDelivered]: handleMessageDelivered,
    [WsEventName.MessageRead]: handleMessageRead,
    [WsEventName.TypingStarted]: handleTypingStarted,
    [WsEventName.TypingStopped]: handleTypingStopped,
    [WsEventName.ConversationCreate]: handleConversationCreate,
    [WsEventName.ConversationUpdate]: handleConversationUpdate,
    [WsEventName.PresenceUpdated]: handlePresenceUpdate,
  };
}
