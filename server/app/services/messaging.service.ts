import crypto from "node:crypto";

import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";

export type CreateChatPayload = {
  name: string | null;
  type: "private" | "group";
  memberUserIds: string[];
  encryptedKeys: { deviceId: string; encryptedKey: string }[];
};

export type AddMemberPayload = {
  userId: string;
  encryptedKeys: { deviceId: string; encryptedKey: string }[];
};

/**
 * Service de messagerie E2E : ciphertexts et clés de chat chiffrées par appareil.
 */
export class MessagingService {
  async createChat(creatorId: string, payload: CreateChatPayload) {
    const uniqueMembers = Array.from(new Set([creatorId, ...payload.memberUserIds]));

    if (payload.type === "private" && uniqueMembers.length !== 2) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Un chat privé doit avoir exactement 2 membres." };
    }
    if (payload.type === "group" && (!payload.name || !payload.name.trim())) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Un groupe doit avoir un nom." };
    }

    const deviceIds = payload.encryptedKeys.map((e) => e.deviceId);
    const devices = await prisma.device.findMany({
      where: { id: { in: deviceIds }, revokedAt: null },
      select: { id: true, user_id: true, public_key: true },
    });
    const deviceById = new Map(devices.map((d) => [d.id, d]));

    for (const row of payload.encryptedKeys) {
      const d = deviceById.get(row.deviceId);
      if (!d?.public_key) {
        throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Appareil ou clé publique invalide." };
      }
      if (!uniqueMembers.includes(d.user_id)) {
        throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Un appareil ne correspond pas aux membres du chat." };
      }
    }

    for (const uid of uniqueMembers) {
      const userDevices = await prisma.device.findMany({
        where: { user_id: uid, revokedAt: null, public_key: { not: null } },
        select: { id: true },
      });
      for (const d of userDevices) {
        if (!payload.encryptedKeys.some((e) => e.deviceId === d.id)) {
          throw {
            code:    ErrorCode.VALIDATION_ERROR,
            status:  400,
            message: `Clé de chat manquante pour l'appareil ${d.id} (utilisateur ${uid}).`,
          };
        }
      }
    }

    return await prisma.$transaction(async (trx) => {
      const chat = await trx.chat.create({
        data: {
          type:          payload.type,
          name:          payload.type === "group" ? payload.name!.trim() : null,
          created_by_id: creatorId,
          members: {
            create: uniqueMembers.map((uid) => ({
              user_id: uid,
              role:    uid === creatorId ? "admin" : "member",
            })),
          },
        },
      });

      await trx.chatMemberKey.createMany({
        data: payload.encryptedKeys.map((e) => ({
          id:                 crypto.randomUUID(),
          chat_id:            chat.id,
          device_id:          e.deviceId,
          encrypted_chat_key: e.encryptedKey,
        })),
      });

      return trx.chat.findUniqueOrThrow({
        where: { id: chat.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id:       true,
                  username: true,
                  profile:  { select: { firstname: true, lastname: true, avatarUrl: true } },
                },
              },
            },
          },
        },
      });
    });
  }

  async addMember(adminUserId: string, chatId: string, payload: AddMemberPayload) {
    await this._assertAdmin(adminUserId, chatId);

    const memberExists = await prisma.conversationMember.findFirst({
      where: { conversation_id: chatId, user_id: payload.userId },
    });
    if (memberExists) {
      throw { code: ErrorCode.CONFLICT, status: 409, message: "Cet utilisateur est déjà membre du chat." };
    }

    const devices = await prisma.device.findMany({
      where: { id: { in: payload.encryptedKeys.map((e) => e.deviceId) }, user_id: payload.userId, revokedAt: null },
      select: { id: true, public_key: true },
    });
    if (devices.length !== payload.encryptedKeys.length) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Appareils invalides pour ce membre." };
    }

    const allUserDevices = await prisma.device.findMany({
      where: { user_id: payload.userId, revokedAt: null, public_key: { not: null } },
      select: { id: true },
    });
    for (const d of allUserDevices) {
      if (!payload.encryptedKeys.some((e) => e.deviceId === d.id)) {
        throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Tous les appareils du membre doivent recevoir une clé." };
      }
    }

    await prisma.$transaction(async (trx) => {
      await trx.conversationMember.create({
        data: {
          id:               crypto.randomUUID(),
          user_id:          payload.userId,
          conversation_id:  chatId,
          role:             "member",
        },
      });
      await trx.chatMemberKey.createMany({
        data: payload.encryptedKeys.map((e) => ({
          id:                 crypto.randomUUID(),
          chat_id:            chatId,
          device_id:          e.deviceId,
          encrypted_chat_key: e.encryptedKey,
        })),
      });
    });

    return prisma.chat.findUniqueOrThrow({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id:       true,
                username: true,
                profile:  { select: { firstname: true, lastname: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });
  }

  async getMyEncryptedChatKey(userId: string, chatId: string, deviceId: string) {
    await this._assertMember(userId, chatId);

    const device = await prisma.device.findFirst({
      where: { id: deviceId, user_id: userId, revokedAt: null },
    });
    if (!device) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Appareil non autorisé." };

    const row = await prisma.chatMemberKey.findFirst({
      where: { chat_id: chatId, device_id: deviceId },
    });
    if (!row) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Clé chiffrée introuvable pour cet appareil." };

    return { encryptedChatKey: row.encrypted_chat_key };
  }

  async listConversations(userId: string) {
    const members = await prisma.conversationMember.findMany({
      where:   { user_id: userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id:       true,
                    username: true,
                    profile:  { select: { firstname: true, lastname: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return Promise.all(
      members.map(async (m) => {
        const chat = m.conversation;
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where:   { chat_id: chat.id, deletedAt: null },
            orderBy: { created_at: "desc" },
          }),
          this.getUnreadCount(userId, chat.id),
        ]);

        return {
          id:          chat.id,
          type:        chat.type,
          name:        chat.name,
          updatedAt:   chat.updatedAt,
          unreadCount,
          lastMessage: lastMessage
            ? {
                id:         lastMessage.id,
                chat_id:    lastMessage.chat_id,
                cipherText: lastMessage.cipherText,
                sender_id:  lastMessage.sender_id,
                created_at: lastMessage.created_at,
                status:     lastMessage.status,
                iv:         lastMessage.iv,
                type:       lastMessage.type,
              }
            : undefined,
          members: chat.members.map((cm) => ({
            id:        cm.user.id,
            username:  cm.user.username,
            avatarUrl: cm.user.profile?.avatarUrl ?? undefined,
          })),
        };
      }),
    );
  }

  async getMessages(userId: string, conversationId: string, page = 1, limit = 30) {
    await this._assertMember(userId, conversationId);

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where:   { chat_id: conversationId, deletedAt: null },
        skip,
        take:    limit,
        orderBy: { created_at: "desc" },
        include: {
          sender:      { select: { id: true, username: true } },
          attachments: true,
        },
      }),
      prisma.message.count({ where: { chat_id: conversationId, deletedAt: null } }),
    ]);

    return { messages: messages.map((m) => this._formatMessage(m)), total };
  }

  private _formatMessage(m: {
    id: string;
    chat_id: string;
    sender_id: string;
    cipherText: string;
    iv: string;
    status: string;
    type: string;
    created_at: Date;
    attachments?: {
      id: string;
      file_url: string;
      iv: string;
      file_name: string;
      file_size: number;
      mime_type: string;
    }[];
  }) {
    return {
      id:         m.id,
      chat_id:    m.chat_id,
      sender_id:  m.sender_id,
      cipherText: m.cipherText,
      iv:         m.iv,
      status:     m.status,
      type:       m.type,
      created_at: m.created_at,
      attachments: (m.attachments ?? []).map((a) => ({
        id:       a.id,
        fileUrl:  a.file_url,
        iv:       a.iv,
        fileName: a.file_name,
        fileSize: a.file_size,
        mimeType: a.mime_type,
      })),
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    payload: {
      content: string;
      iv: string;
      type?: string;
      attachments?: { fileUrl: string; iv: string; fileName: string; fileSize: number; mimeType: string }[];
    },
  ) {
    await this._assertMember(userId, conversationId);

    const message = await prisma.message.create({
      data: {
        id:         crypto.randomUUID(),
        chat_id:    conversationId,
        sender_id:  userId,
        cipherText: payload.content,
        iv:         payload.iv,
        status:     "send",
        type:       (payload.type ?? "TEXT") as any,
        attachments: {
          create: (payload.attachments ?? []).map((a) => ({
            id:         crypto.randomUUID(),
            file_url:   a.fileUrl,
            iv:         a.iv,
            file_name:  a.fileName,
            file_size:  a.fileSize,
            mime_type:  a.mimeType,
          })),
        },
      },
      include: { attachments: true },
    });

    await prisma.chat.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    return this._formatMessage(message);
  }

  async updateMessage(userId: string, messageId: string, content: string, iv: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Message introuvable." };
    if (message.sender_id !== userId) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisee." };

    return await prisma.message.update({
      where: { id: messageId },
      data: { cipherText: content, iv, editedAt: new Date() },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Message introuvable." };
    if (message.sender_id !== userId) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisee." };

    return await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  async setDelivered(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Message introuvable." };
    if (message.sender_id === userId) {
      return message;
    }

    return await prisma.message.update({
      where: { id: messageId },
      data: { status: "delivered" },
    });
  }

  async markAsRead(userId: string, conversationId: string) {
    await prisma.conversationMember.updateMany({
      where: { user_id: userId, conversation_id: conversationId },
      data:  { lastReadAt: new Date() },
    });
  }

  async getConversationMembers(conversationId: string) {
    return await prisma.conversationMember.findMany({
      where: { conversation_id: conversationId },
      select: { user_id: true },
    });
  }

  async getMessageSummary(messageId: string) {
    return await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: { select: { id: true, username: true } } },
    });
  }

  async getUnreadCount(userId: string, conversationId: string) {
    const membership = await prisma.conversationMember.findFirst({
      where: { user_id: userId, conversation_id: conversationId },
    });
    if (!membership) return 0;

    const since = membership.lastReadAt ?? new Date(0);
    return await prisma.message.count({
      where: {
        chat_id:    conversationId,
        sender_id:  { not: userId },
        created_at: { gt: since },
        deletedAt:  null,
      },
    });
  }

  private async _assertMember(userId: string, conversationId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { user_id: userId, conversation_id: conversationId },
    });
    if (!member) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Accès refusé à cette conversation." };
  }

  private async _assertAdmin(userId: string, conversationId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { user_id: userId, conversation_id: conversationId },
    });
    if (!member || member.role !== "admin") {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Seuls les administrateurs du chat peuvent effectuer cette action." };
    }
  }
}
