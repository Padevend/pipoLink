import crypto from "node:crypto";

import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { Message } from "../../generated/prisma/index.js";

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

    if (payload.type === "private") {
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: "private",
          AND: [
            { members: { some: { user_id: uniqueMembers[0] } } },
            { members: { some: { user_id: uniqueMembers[1] } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { firstname: true, lastname: true, avatarUrl: true } },
                },
              },
            },
          },
        },
      });

      if (existingChat) {
        return existingChat;
      }
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
            code: ErrorCode.VALIDATION_ERROR,
            status: 400,
            message: `Clé de chat manquante pour l'appareil ${d.id} (utilisateur ${uid}).`,
          };
        }
      }
    }

    return await prisma.$transaction(async (trx) => {
      const chat = await trx.chat.create({
        data: {
          type: payload.type,
          name: payload.type === "group" ? payload.name!.trim() : null,
          created_by_id: creatorId,
          members: {
            create: uniqueMembers.map((uid) => ({
              user_id: uid,
              role: uid === creatorId ? "admin" : "member",
            })),
          },
        },
      });

      await trx.chatMemberKey.createMany({
        data: payload.encryptedKeys.map((e) => ({
          id: crypto.randomUUID(),
          chat_id: chat.id,
          device_id: e.deviceId,
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
                  id: true,
                  username: true,
                  profile: { select: { firstname: true, lastname: true, avatarUrl: true } },
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
      await trx.conversationMember.deleteMany({
        where: {
          user_id: payload.userId,
          conversation_id: chatId,
        },
      });
      await trx.conversationMember.create({
        data: {
          id: crypto.randomUUID(),
          user_id: payload.userId,
          conversation_id: chatId,
          role: "member",
        },
      });

      const deviceIds = payload.encryptedKeys.map((e) => e.deviceId);
      await trx.chatMemberKey.deleteMany({
        where: {
          chat_id: chatId,
          device_id: { in: deviceIds },
        },
      });
      await trx.chatMemberKey.createMany({
        data: payload.encryptedKeys.map((e) => ({
          id: crypto.randomUUID(),
          chat_id: chatId,
          device_id: e.deviceId,
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
                id: true,
                username: true,
                profile: { select: { firstname: true, lastname: true, avatarUrl: true } },
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
      where: { user_id: userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profile: { select: { firstname: true, lastname: true, avatarUrl: true, phone: true } },
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
        const since = m.lastReadAt ?? new Date(0);
        
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where: { chat_id: chat.id, deletedAt: null },
            orderBy: { created_at: "desc" },
          }),
          prisma.message.count({
            where: {
              chat_id: chat.id,
              sender_id: { not: userId },
              created_at: { gt: since },
              deletedAt: null,
            },
          }),
        ]);

        return {
          id: chat.id,
          type: chat.type,
          name: chat.name,
          updatedAt: chat.updatedAt,
          unreadCount,
          lastMessage: lastMessage
            ? {
              id: lastMessage.id,
              chat_id: lastMessage.chat_id,
              cipherText: lastMessage.cipherText,
              sender_id: lastMessage.sender_id,
              created_at: lastMessage.created_at,
              status: lastMessage.status,
              iv: lastMessage.iv,
              type: lastMessage.type,
            }
            : undefined,
          members: chat.members.map((cm) => ({
            id: cm.user.id,
            username: cm.user.username,
            avatarUrl: cm.user.profile?.avatarUrl ?? undefined,
            phone: cm.user.profile?.phone ?? undefined,
            role: cm.role
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
        where: { chat_id: conversationId },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          },
          attachments: true,
          responseTo: {
            include: {
              sender: { select: { id: true, username: true } },
            }
          }
        },
      }),
      prisma.message.count({ where: { chat_id: conversationId } }),
    ]);

    return { messages: messages.map((m) => this._formatMessage(m as any)), total };
  }

  private _formatMessage(m: any) {
    return {
      id: m.id,
      chat_id: m.chat_id,
      sender_id: m.sender_id,
      cipherText: m.cipherText,
      iv: m.iv,
      status: m.status,
      type: m.type,
      created_at: m.created_at,
      is_deleted: !!m.deletedAt,
      attachments: (m.attachments ?? []).map((a: any) => ({
        id: a.id,
        fileUrl: a.file_url,
        iv: a.iv,
        fileName: a.file_name,
        fileSize: a.file_size,
        mimeType: a.mime_type,
      })),
      sender: {
        id: m.sender?.id ?? "",
        username: m.sender?.username ?? "",
        profile: {
          avatarUrl: m.sender?.profile?.avatarUrl ?? undefined,
        }
      },
      responseTo: m.responseTo ? {
        id: m.responseTo.id,
        chat_id: m.responseTo.chat_id,
        sender_id: m.responseTo.sender_id,
        cipherText: m.responseTo.cipherText,
        iv: m.responseTo.iv,
        status: m.responseTo.status,
        type: m.responseTo.type,
        created_at: m.responseTo.created_at,
        is_deleted: !!m.responseTo.deletedAt,
        sender: m.responseTo.sender ? {
          id: m.responseTo.sender.id,
          username: m.responseTo.sender.username,
        } : undefined
      } : undefined
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    payload: {
      content: string;
      iv: string;
      type?: string;
      replyToId?: string;
      attachments?: { fileUrl: string; iv: string; fileName: string; fileSize: number; mimeType: string }[];
    },
  ) {
    await this._assertMember(userId, conversationId);

    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        chat_id: conversationId,
        sender_id: userId,
        cipherText: payload.content,
        iv: payload.iv,
        status: "send",
        response_to: payload.replyToId,
        type: (payload.type ?? "TEXT") as any,
        attachments: {
          create: (payload.attachments ?? []).map((a) => ({
            id: crypto.randomUUID(),
            file_url: a.fileUrl,
            iv: a.iv,
            file_name: a.fileName,
            file_size: a.fileSize,
            mime_type: a.mimeType,
          })),
        },
      },
      include: {
        attachments: true,
        sender: { 
          select: { 
            id: true, 
            username: true, 
            profile: { 
              select: { 
                avatarUrl: true 
              } 
            } 
          } 
        },
        responseTo: true
      },
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
      data: { lastReadAt: new Date() },
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
        chat_id: conversationId,
        sender_id: { not: userId },
        created_at: { gt: since },
        deletedAt: null,
      },
    });
  }

  async leaveGroup(userId: string, conversationId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { user_id: userId, conversation_id: conversationId },
      include: { conversation: true },
    });
    if (!member) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Vous n'êtes pas membre de ce groupe." };
    if (member.conversation.type !== "group") throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Action réservée aux groupes." };

    await prisma.conversationMember.delete({ where: { id: member.id } });

    const remaining = await prisma.conversationMember.count({ where: { conversation_id: conversationId } });
    if (remaining === 0) {
      await prisma.chat.delete({ where: { id: conversationId } });
    }
  }

  async deleteChat(userId: string, conversationId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { user_id: userId, conversation_id: conversationId },
    });
    if (!member) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Chat introuvable." };

    await prisma.conversationMember.delete({ where: { id: member.id } });
  }

  async updateChatDetails(userId: string, conversationId: string, payload: { name: string }) {
    await this._assertAdmin(userId, conversationId);
    return await prisma.chat.update({
      where: { id: conversationId },
      data: { name: payload.name.trim() },
    });
  }

  async promoteMember(adminUserId: string, conversationId: string, targetUserId: string) {
    const chat = await prisma.chat.findUnique({ where: { id: conversationId } });
    if (!chat || chat.created_by_id !== adminUserId) {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Seul le créateur du groupe peut promouvoir un membre." };
    }
    const member = await prisma.conversationMember.findFirst({
      where: { conversation_id: conversationId, user_id: targetUserId }
    });
    if (!member) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Membre introuvable." };
    return await prisma.conversationMember.update({
      where: { id: member.id },
      data: { role: 'admin' }
    });
  }

  async demoteMember(adminUserId: string, conversationId: string, targetUserId: string) {
    const chat = await prisma.chat.findUnique({ where: { id: conversationId } });
    if (!chat || chat.created_by_id !== adminUserId) {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Seul le créateur du groupe peut destituer un administrateur." };
    }
    if (targetUserId === adminUserId) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Vous ne pouvez pas vous destituer vous-même." };
    }
    const member = await prisma.conversationMember.findFirst({
      where: { conversation_id: conversationId, user_id: targetUserId }
    });
    if (!member) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Membre introuvable." };
    return await prisma.conversationMember.update({
      where: { id: member.id },
      data: { role: 'member' }
    });
  }

  async kickMember(adminUserId: string, conversationId: string, targetUserId: string) {
    const chat = await prisma.chat.findUnique({ where: { id: conversationId } });
    if (!chat) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Groupe introuvable." };
    await this._assertAdmin(adminUserId, conversationId);

    const targetMember = await prisma.conversationMember.findFirst({
      where: { conversation_id: conversationId, user_id: targetUserId }
    });
    if (!targetMember) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Membre introuvable." };

    const isSuperAdmin = chat.created_by_id === adminUserId;
    if (targetMember.user_id === chat.created_by_id) {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Impossible de bannir le créateur du groupe." };
    }
    if (targetMember.role === "admin" && !isSuperAdmin) {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Seul le créateur du groupe peut exclure un administrateur." };
    }

    await prisma.conversationMember.delete({ where: { id: targetMember.id } });
  }

  async createInvitation(adminUserId: string, conversationId: string, payload: { maxUses?: number, expiresAt?: string, encryptedChatKey?: string }) {
    await this._assertAdmin(adminUserId, conversationId);
    const token = crypto.randomUUID();
    const invitation = await prisma.groupInvitation.create({
      data: {
        chat_id: conversationId,
        token,
        max_uses: payload.maxUses ?? null,
        expires_at: payload.expiresAt ? new Date(payload.expiresAt) : null,
        created_by_id: adminUserId,
        encrypted_chat_key: payload.encryptedChatKey ?? null,
      }
    });
    return invitation;
  }

  async getInvitationDetails(token: string) {
    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        chat: {
          include: {
            _count: { select: { members: true } }
          }
        }
      }
    });
    if (!invitation || invitation.revoked_at) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Lien d'invitation invalide ou expiré." };
    }
    if (invitation.expires_at && invitation.expires_at < new Date()) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Lien d'invitation expiré." };
    }
    if (invitation.max_uses !== null && invitation.uses >= invitation.max_uses) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Nombre maximal d'utilisations atteint." };
    }
    return {
      id: invitation.id,
      chatId: invitation.chat_id,
      chatName: invitation.chat.name,
      memberCount: invitation.chat._count.members,
      encryptedChatKey: invitation.encrypted_chat_key,
    };
  }

  async joinViaInvitation(userId: string, token: string, payload: { encryptedKeys: { deviceId: string, encryptedKey: string }[] }) {
    const details = await prisma.groupInvitation.findUnique({
      where: { token },
      include: { chat: true }
    });
    if (!details || details.revoked_at) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Lien d'invitation invalide." };
    }
    if (details.expires_at && details.expires_at < new Date()) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Lien d'invitation expiré." };
    }
    if (details.max_uses !== null && details.uses >= details.max_uses) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Lien d'invitation expiré (utilisation maximale atteinte)." };
    }

    const existing = await prisma.conversationMember.findUnique({
      where: { user_id_conversation_id: { user_id: userId, conversation_id: details.chat_id } }
    });
    if (existing) {
      return details.chat;
    }

    return await prisma.$transaction(async (trx) => {
      await trx.groupInvitation.update({
        where: { id: details.id },
        data: { uses: { increment: 1 } }
      });

      const member = await trx.conversationMember.create({
        data: {
          user_id: userId,
          conversation_id: details.chat_id,
          role: 'member',
        }
      });

      if (payload.encryptedKeys && payload.encryptedKeys.length > 0) {
        await trx.chatMemberKey.createMany({
          data: payload.encryptedKeys.map((e) => ({
            chat_id: details.chat_id,
            device_id: e.deviceId,
            encrypted_chat_key: e.encryptedKey,
          }))
        });
      }

      return details.chat;
    });
  }

  async listInvitations(userId: string, conversationId: string) {
    await this._assertAdmin(userId, conversationId);
    return await prisma.groupInvitation.findMany({
      where: { chat_id: conversationId, revoked_at: null },
      orderBy: { created_at: 'desc' }
    });
  }

  async revokeInvitation(userId: string, invitationId: string) {
    const invitation = await prisma.groupInvitation.findUnique({
      where: { id: invitationId }
    });
    if (!invitation) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Lien d'invitation introuvable." };
    await this._assertAdmin(userId, invitation.chat_id);
    return await prisma.groupInvitation.update({
      where: { id: invitationId },
      data: { revoked_at: new Date() }
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
