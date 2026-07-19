import { prisma } from "../../config/database.js";
import { FCMService } from "../../src/app/services/fcm.service.js";

const fcm = new FCMService();

type MessageLike = {
  id: string;
  cipherText: string;
  iv: string;
  type?: string | null;
};

/**
 * Push data-only pour un nouveau message : le client (même app fermée)
 * déchiffre et affiche « envoyeur / contenu » (privé) ou « groupe / envoyeur: contenu ».
 */
export async function pushNewMessage(
  senderId: string,
  conversationId: string,
  message: MessageLike,
): Promise<void> {
  try {
    const [chat, sender, devices] = await Promise.all([
      prisma.chat.findUnique({
        where: { id: conversationId },
        select: { type: true, name: true },
      }),
      prisma.user.findUnique({
        where: { id: senderId },
        select: { username: true },
      }),
      prisma.device.findMany({
        where: {
          fcm_token: { not: null },
          user: {
            memberships: { some: { conversation_id: conversationId } },
          },
          user_id: { not: senderId },
        },
        select: { fcm_token: true },
      }),
    ]);

    const tokens = devices.map((d) => d.fcm_token as string);
    if (!chat || tokens.length === 0) return;

    await fcm.sendDataPush(tokens, {
      type: "MESSAGE",
      messageId: message.id,
      chatId: conversationId,
      chatType: chat.type,
      chatName: chat.name ?? "",
      senderName: sender?.username ?? "",
      senderId,
      cipherText: message.cipherText,
      iv: message.iv,
      messageType: message.type ?? "TEXT",
    });
  } catch (error) {
    console.error("[MessagePush] Erreur lors de l'envoi du push :", error);
  }
}
