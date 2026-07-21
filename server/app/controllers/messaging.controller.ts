import { HttpContext } from "../../config/app.js";
import { MessagingService } from "../services/messaging.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { sendMessageValidator, createChatValidator, addChatMemberValidator } from "../validators/messaging.validator.js";
import { NotificationService } from "../services/notification.service.js";
import { FileService } from "../services/file.service.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";
import { pushNewMessage } from "../services/message-push.service.js";
import { prisma } from "../../config/database.js";

export class MessagingController {
  private service = new MessagingService();
  private fileService = new FileService();
  private notifications = new NotificationService();

  async listConversations(c: HttpContext) {
    const userId = c.get("userId") as string;
    const conversations = await this.service.listConversations(userId);
    return ApiResponse.success(c, conversations, "Conversations récupérées.");
  }

  async createChat(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(createChatValidator);
    const conversation = await this.service.createChat(userId, {
      name:           payload.name ?? null,
      type:           payload.type,
      memberUserIds:  payload.memberUserIds,
      encryptedKeys:  payload.encryptedKeys,
    });
    const chatLabel = payload.type === "group" ? payload.name ?? "Groupe" : "Nouvelle conversation";
    for (const member of conversation.members) {
      RealtimeBus.addUserToConversationRoom(member.user_id, conversation.id);
      RealtimeBus.emit(WsEventName.ConversationCreated, { conversation }, { userId: member.user_id });
      if (member.user_id !== userId) {
        await this.notifications.createNotification(member.user_id, {
          title: "Nouveau chat",
          body:    `Vous avez été ajouté à « ${chatLabel} ».`,
          type:    "CHAT",
          data:    { conversationId: conversation.id },
        });
        RealtimeBus.emit(WsEventName.NotificationCreated, { conversationId: conversation.id }, { userId: member.user_id });
      }
    }
    return ApiResponse.success(c, conversation, "Conversation créée.", 201);
  }

  async addMember(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const payload = await c.validateUsing(addChatMemberValidator);
    const conversation = await this.service.addMember(userId, chatId, payload);
    const members = await this.service.getConversationMembers(chatId);
    for (const m of members) {
      RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId: chatId, conversation }, { userId: m.user_id });
    }
    return ApiResponse.success(c, conversation, "Membre ajouté.", 201);
  }

  async myEncryptedChatKey(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const deviceId = c.req.query("deviceId");
    if (!deviceId) {
      return ApiResponse.error(c, ErrorCode.VALIDATION_ERROR, "deviceId requis.", 400);
    }
    const result = await this.service.getMyEncryptedChatKey(userId, chatId, deviceId);
    return ApiResponse.success(c, result, "Clé chiffrée.");
  }

  async rotateChatKey(c: HttpContext) {
    const userId = c.get("userId") as string;
    const deviceId = c.get("deviceId") as string | undefined;
    const chatId = c.req.param("id")!;
    const body = (await c.req.json().catch(() => ({}))) as {
      keys?: { deviceId: string; encryptedKey: string }[];
    };

    const result = await this.service.rotateChatKey(userId, chatId, body.keys ?? []);

    // Prévenir les membres connectés : leur clé locale mise en cache est obsolète
    RealtimeBus.emit(
      WsEventName.ChatKeyRotated,
      { conversationId: chatId, rotatedByDeviceId: deviceId ?? null },
      { conversationId: chatId },
    );

    return ApiResponse.success(c, result, "Clé du chat renouvelée.");
  }

  async getMessages(c: HttpContext) {
    const userId = c.get("userId") as string;
    const conversationId = c.req.param("id")!;
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "30", 10);
    const result = await this.service.getMessages(userId, conversationId, page, limit);
    return ApiResponse.paginated(c, result.messages, result.total, page, limit);
  }

  async sendMessage(c: HttpContext) {
    const userId = c.get("userId") as string;
    const conversationId = c.req.param("id")!;
    const payload = await c.validateUsing(sendMessageValidator);
    const message = await this.service.sendMessage(userId, conversationId, payload);
    const members = await this.service.getConversationMembers(conversationId);
    const lastMessage = await this.service.getMessageSummary(message.id);

    RealtimeBus.emit(WsEventName.MessageCreated, { conversationId, message }, { conversationId });

    for (const member of members) {
      const unread = await this.service.getUnreadCount(member.user_id, conversationId);
      RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId, lastMessage, unreadCount: unread }, { userId: member.user_id });
    }

    const recipients = members.filter((m) => m.user_id !== userId);
    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((m) => ({
          user_id: m.user_id,
          title: "Nouveau message",
          body: "Vous avez un nouveau message.",
          type: "MESSAGE",
          data: { conversationId, messageId: message.id },
        })),
      });
      for (const member of recipients) {
        RealtimeBus.emit(WsEventName.NotificationCreated, { conversationId, messageId: message.id }, { userId: member.user_id });
      }
      // Push data-only : le client déchiffre et affiche (même app fermée)
      void pushNewMessage(userId, conversationId, message);
    }

    return ApiResponse.success(c, message, "Message envoyé.", 201);
  }
  async deleteMessage(c: HttpContext) {
    const userId = c.get("userId") as string;
    const conversationId = c.req.param("id")!;
    const messageId = c.req.param("messageId")!;

    await this.service.deleteMessage(userId, messageId);

    RealtimeBus.emit(WsEventName.MessageDeleted, { conversationId, messageId }, { conversationId });

    return ApiResponse.success(c, null, "Message supprimé.");
  }

  async uploadFile(c: HttpContext) {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await this.fileService.storeDocument(buffer, file.type);
      return ApiResponse.success(c, {
        url: stored.url,
        size: stored.size,
        fileName: file.name,
        mimeType: file.type,
      }, "Fichier uploadé.", 201);
    }

    return ApiResponse.error(c, "VALIDATION_ERROR", "Fichier invalide.", 400);
  }

  async uploadAttachment(c: HttpContext) {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await this.fileService.storeMessageAttachment(buffer);
      return ApiResponse.success(c, {
        url:      stored.url,
        size:     stored.size,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
      }, "Pièce jointe uploadée.", 201);
    }

    return ApiResponse.error(c, "VALIDATION_ERROR", "Fichier invalide.", 400);
  }

  async markAsRead(c: HttpContext) {
    const userId = c.get("userId") as string;
    const conversationId = c.req.param("id")!;
    await this.service.markAsRead(userId, conversationId);
    RealtimeBus.emit(WsEventName.MessageRead, { conversationId, userId }, { conversationId });
    return ApiResponse.success(c, null, "Messages marqués comme lus.");
  }

  async leaveGroup(c: HttpContext) {
    const userId = c.get("userId") as string;
    const conversationId = c.req.param("id")!;
    await this.service.leaveGroup(userId, conversationId);
    RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId }, { conversationId });
    return ApiResponse.success(c, null, "Vous avez quitté le groupe.");
  }

  async deleteChat(c: HttpContext) {
    const userId = c.get("userId") as string;
    const conversationId = c.req.param("id")!;
    await this.service.deleteChat(userId, conversationId);
    RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId }, { userId });
    return ApiResponse.success(c, null, "Chat supprimé.");
  }

  async updateChatDetails(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const body = await c.req.json();
    const chat = await this.service.updateChatDetails(userId, chatId, body);
    const members = await this.service.getConversationMembers(chatId);
    for (const m of members) {
      RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId: chatId, conversation: chat }, { userId: m.user_id });
    }
    return ApiResponse.success(c, chat, "Groupe mis à jour.");
  }

  async promoteMember(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const { targetUserId } = await c.req.json();
    const member = await this.service.promoteMember(userId, chatId, targetUserId);
    const members = await this.service.getConversationMembers(chatId);
    for (const m of members) {
      RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId: chatId }, { userId: m.user_id });
    }
    return ApiResponse.success(c, member, "Membre promu au rang d'administrateur.");
  }

  async demoteMember(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const { targetUserId } = await c.req.json();
    const member = await this.service.demoteMember(userId, chatId, targetUserId);
    const members = await this.service.getConversationMembers(chatId);
    for (const m of members) {
      RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId: chatId }, { userId: m.user_id });
    }
    return ApiResponse.success(c, member, "Administrateur destitué.");
  }

  async kickMember(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const { targetUserId } = await c.req.json();
    await this.service.kickMember(userId, chatId, targetUserId);
    const members = await this.service.getConversationMembers(chatId);
    for (const m of members) {
      RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId: chatId }, { userId: m.user_id });
    }
    RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId: chatId }, { userId: targetUserId });
    return ApiResponse.success(c, null, "Membre exclu du groupe.");
  }

  async createInvitation(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const body = await c.req.json();
    const invitation = await this.service.createInvitation(userId, chatId, body);
    return ApiResponse.success(c, invitation, "Lien d'invitation généré.", 201);
  }

  async getInvitationDetails(c: HttpContext) {
    const token = c.req.param("token")!;
    const details = await this.service.getInvitationDetails(token);
    return ApiResponse.success(c, details, "Détails de l'invitation.");
  }

  async joinViaInvitation(c: HttpContext) {
    const userId = c.get("userId") as string;
    const token = c.req.param("token")!;
    const body = await c.req.json();
    const chat = await this.service.joinViaInvitation(userId, token, body);
    RealtimeBus.addUserToConversationRoom(userId, chat.id);
    const members = await this.service.getConversationMembers(chat.id);
    for (const m of members) {
      RealtimeBus.emit(WsEventName.ConversationUpdated, { conversationId: chat.id }, { userId: m.user_id });
    }
    return ApiResponse.success(c, chat, "Vous avez rejoint le groupe.");
  }

  async listInvitations(c: HttpContext) {
    const userId = c.get("userId") as string;
    const chatId = c.req.param("id")!;
    const invitations = await this.service.listInvitations(userId, chatId);
    return ApiResponse.success(c, invitations, "Invitations récupérées.");
  }

  async revokeInvitation(c: HttpContext) {
    const userId = c.get("userId") as string;
    const invitationId = c.req.param("invitationId")!;
    const invitation = await this.service.revokeInvitation(userId, invitationId);
    return ApiResponse.success(c, invitation, "Lien d'invitation révoqué.");
  }
}
