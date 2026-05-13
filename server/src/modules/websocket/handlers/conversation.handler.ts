import { WsEventName } from "../events/event-names.js";
import { validatePayload } from "../utils/validation.js";
import { conversationCreateValidator } from "../dto/conversation.dto.js";
import type { HandlerContext } from "./index.js";
import { MessagingService } from "../../../../app/services/messaging.service.js";

const messaging = new MessagingService();

export async function handleConversationCreate(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(conversationCreateValidator, payload);
  const conversation = await messaging.createChat(state.userId, {
    name:           data.name ?? null,
    type:           data.type,
    memberUserIds:  data.memberUserIds,
    encryptedKeys:  data.encryptedKeys,
  });

  for (const member of conversation.members) {
    ctx.gateway.addUserToConversationRoom(member.user_id, conversation.id);
    ctx.gateway.emit(WsEventName.ConversationCreated, { conversation }, { userId: member.user_id });
  }

  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.ConversationCreate, { conversationId: conversation.id });
}

export async function handleConversationUpdate(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  throw { code: "FORBIDDEN", status: 403, message: "Mise a jour non autorisee via client." };
}
