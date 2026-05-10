import { WsEventName } from "../events/event-names.js";
import { validatePayload } from "../utils/validation.js";
import { messageSendValidator, messageUpdateValidator, messageDeleteValidator, messageDeliveredValidator, messageReadValidator } from "../dto/message.dto.js";
import type { HandlerContext } from "./index.js";
import { MessagingService } from "../../../../app/services/messaging.service.js";
import { NotificationService } from "../../../../app/services/notification.service.js";

const messaging = new MessagingService();
const notifications = new NotificationService();

export async function handleMessageSend(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(messageSendValidator, payload);
  const message = await messaging.sendMessage(state.userId, data.conversationId, {
    content: data.content,
    iv: data.iv,
    type: data.type,
  });

  const members = await messaging.getConversationMembers(data.conversationId);
  const lastMessage = await messaging.getMessageSummary(message.id);

  ctx.gateway.emit(WsEventName.MessageCreated, { conversationId: data.conversationId, message }, {
    conversationId: data.conversationId,
  });

  for (const member of members) {
    const unread = await messaging.getUnreadCount(member.user_id, data.conversationId);
    ctx.gateway.emit(WsEventName.ConversationUpdated, { conversationId: data.conversationId, lastMessage, unreadCount: unread }, {
      userId: member.user_id,
    });
  }

  for (const member of members) {
    if (member.user_id === state.userId) continue;
    await notifications.createNotification(member.user_id, {
      title: "Nouveau message",
      body: "Vous avez un nouveau message.",
      type: "MESSAGE",
      data: { conversationId: data.conversationId, messageId: message.id },
    });
    ctx.gateway.emit(WsEventName.NotificationCreated, { conversationId: data.conversationId, messageId: message.id }, {
      userId: member.user_id,
    });
  }

  ctx.gateway.emit(WsEventName.MessageDelivered, { messageId: message.id, conversationId: data.conversationId }, {
    userId: state.userId,
  });

  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.MessageSend, { messageId: message.id });
}

export async function handleMessageUpdate(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(messageUpdateValidator, payload);
  const message = await messaging.updateMessage(state.userId, data.messageId, data.content, data.iv);

  ctx.gateway.emit(WsEventName.MessageUpdated, { message }, { conversationId: message.chat_id });
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.MessageUpdate, { messageId: message.id });
}

export async function handleMessageDelete(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(messageDeleteValidator, payload);
  const message = await messaging.deleteMessage(state.userId, data.messageId);

  ctx.gateway.emit(WsEventName.MessageDeleted, { messageId: message.id, conversationId: message.chat_id }, {
    conversationId: message.chat_id,
  });
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.MessageDelete, { messageId: message.id });
}

export async function handleMessageDelivered(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(messageDeliveredValidator, payload);
  const message = await messaging.setDelivered(state.userId, data.messageId);
  ctx.gateway.emit(WsEventName.MessageDelivered, { messageId: message.id, conversationId: message.chat_id }, {
    conversationId: message.chat_id,
  });
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.MessageDelivered, { messageId: message.id });
}

export async function handleMessageRead(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(messageReadValidator, payload);
  await messaging.markAsRead(state.userId, data.conversationId);

  ctx.gateway.emit(WsEventName.MessageRead, { conversationId: data.conversationId, userId: state.userId }, {
    conversationId: data.conversationId,
  });
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.MessageRead, { conversationId: data.conversationId });
}
