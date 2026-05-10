import { WsEventName } from "../events/event-names.js";
import { validatePayload } from "../utils/validation.js";
import { typingValidator } from "../dto/typing.dto.js";
import type { HandlerContext } from "./index.js";

export async function handleTypingStarted(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(typingValidator, payload);
  ctx.gateway.emit(WsEventName.TypingStarted, { conversationId: data.conversationId, userId: state.userId }, {
    conversationId: data.conversationId,
    excludeConnectionId: ctx.connectionId,
  });
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.TypingStarted, { conversationId: data.conversationId });
}

export async function handleTypingStopped(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(typingValidator, payload);
  ctx.gateway.emit(WsEventName.TypingStopped, { conversationId: data.conversationId, userId: state.userId }, {
    conversationId: data.conversationId,
    excludeConnectionId: ctx.connectionId,
  });
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.TypingStopped, { conversationId: data.conversationId });
}
