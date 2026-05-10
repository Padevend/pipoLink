import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";

/**
 * Service de messagerie.
 * Le contenu des messages est chiffré côté client (E2E).
 * Le backend stocke et relaie les ciphertexts sans les déchiffrer.
 */
export class MessagingService {

  /**
   * Crée une nouvelle conversation privée entre membres.
   */
  async createConversation(userId: string, memberIds: string[]) {
    const uniqueMembers = Array.from(new Set([userId, ...memberIds]));

    const chat = await prisma.chat.create({
      data: {
        members: {
          create: uniqueMembers.map((id) => ({ user_id: id })),
        },
      },
      include: { members: true },
    });

    return chat;
  }

  /**
   * Liste les conversations d'un utilisateur avec le dernier message.
   * Trie par date de dernier message décroissante.
   *
   * @param userId - Identifiant de l'utilisateur
   * @returns      - Tableau de conversations avec métadonnées
   */
  async listConversations(userId: string) {
    const members = await prisma.conversationMember.findMany({
      where:   { user_id: userId },
      include: { conversation: true },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return members.map(m => m.conversation);
  }

  /**
   * Récupère les messages d'une conversation avec pagination.
   * Vérifie que l'utilisateur est membre de la conversation.
   *
   * @param userId         - Identifiant de l'utilisateur
   * @param conversationId - Identifiant de la conversation
   * @param page           - Numéro de page (défaut 1)
   * @param limit          - Taille de page (défaut 30)
   * @returns              - { messages, total }
   */
  async getMessages(userId: string, conversationId: string, page = 1, limit = 30) {
    await this._assertMember(userId, conversationId);

    const skip  = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where:   { chat_id: conversationId, deletedAt: null },
        skip,
        take:    limit,
        orderBy: { created_at: "desc" },
        include: { sender: { select: { id: true, username: true } } },
      }),
      prisma.message.count({ where: { chat_id: conversationId, deletedAt: null } }),
    ]);

    return { messages, total };
  }

  /**
   * Envoie un message chiffré dans une conversation.
   * Le champ `cipherText` est le contenu chiffré AES-GCM côté client.
   *
   * @param userId         - Identifiant de l'expéditeur
   * @param conversationId - Identifiant de la conversation
   * @param payload        - { content (= cipherText), iv, type }
   * @returns              - Message créé
   */
  async sendMessage(userId: string, conversationId: string, payload: { content: string; iv: string; type?: string }) {
    await this._assertMember(userId, conversationId);

    const message = await prisma.message.create({
      data: {
        chat_id:    conversationId,
        sender_id:  userId,
        cipherText: payload.content,
        iv:         payload.iv,
        status:     "send",
        type:       (payload.type ?? "TEXT") as any,
      },
    });

    await prisma.chat.update({ where: { id: conversationId }, data: { created_at: new Date() } });

    return message;
  }

  /**
   * Met a jour un message existant (edite par l'expediteur).
   */
  async updateMessage(userId: string, messageId: string, content: string, iv: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Message introuvable." };
    if (message.sender_id !== userId) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisee." };

    return await prisma.message.update({
      where: { id: messageId },
      data: { cipherText: content, iv, editedAt: new Date() },
    });
  }

  /**
   * Supprime un message (soft delete).
   */
  async deleteMessage(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Message introuvable." };
    if (message.sender_id !== userId) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Action non autorisee." };

    return await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Marque un message comme delivre.
   */
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

  /**
   * Marque les messages d'une conversation comme lus.
   * Met à jour lastReadAt du membre dans la conversation.
   *
   * @param userId         - Identifiant de l'utilisateur
   * @param conversationId - Identifiant de la conversation
   */
  async markAsRead(userId: string, conversationId: string) {
    await prisma.conversationMember.updateMany({
      where: { user_id: userId, conversation_id: conversationId },
      data:  { lastReadAt: new Date() },
    });
  }

  /**
   * Retourne les membres d'une conversation.
   */
  async getConversationMembers(conversationId: string) {
    return await prisma.conversationMember.findMany({
      where: { conversation_id: conversationId },
      select: { user_id: true },
    });
  }

  /**
   * Retourne un resume de message pour les mises a jour de conversation.
   */
  async getMessageSummary(messageId: string) {
    return await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: { select: { id: true, username: true } } },
    });
  }

  /**
   * Compte les messages non lus pour un utilisateur dans une conversation.
   */
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

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Vérifie qu'un utilisateur est membre d'une conversation.
   * Lance une erreur FORBIDDEN s'il ne l'est pas.
   */
  private async _assertMember(userId: string, conversationId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { user_id: userId, conversation_id: conversationId },
    });
    if (!member) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Accès refusé à cette conversation." };
  }
}
