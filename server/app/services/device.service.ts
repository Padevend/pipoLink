import { prisma }      from "../../config/database.js";
import { MailerService } from "./mailer.service.js";
import { ErrorCode }   from "../helpers/error-codes.js";
import { verifyDeviceKeyAttestation } from "../helpers/device-crypto.js";

/**
 * Service de gestion des appareils de confiance.
 */
export class DeviceService {
  private mailer = new MailerService();

  /**
   * Liste les appareils actifs (non révoqués) d'un utilisateur.
   *
   * @param userId - Identifiant de l'utilisateur
   * @returns      - Tableau des appareils actifs
   */
  async listDevices(userId: string) {
    return await prisma.device.findMany({
      where:   { user_id: userId, revokedAt: null },
      orderBy: { lastActiveAt: "desc" },
    });
  }

  /**
   * Détache un appareil de son compte (révocation + suppression des clés de chat).
   * Utilisé avant création d'un nouveau compte sur le même appareil physique.
   */
  async detachDeviceByFingerprint(fingerprint: string) {
    const device = await prisma.device.findFirst({
      where: { fingerprint, revokedAt: null },
    });
    if (!device) return { detached: false as const };

    await prisma.$transaction(async (trx) => {
      await trx.chatMemberKey.deleteMany({ where: { device_id: device.id } });
      await trx.refreshToken.updateMany({
        where: { device_id: device.id, revokedAt: null },
        data:  { revokedAt: new Date() },
      });
      await trx.device.update({
        where: { id: device.id },
        data: {
          revokedAt:     new Date(),
          public_key:    null,
          key_signature: null,
          keyCreatedAt:  null,
          keyExpiresAt:  null,
        },
      });
      await trx.auditLog.create({
        data: {
          user_id:  device.user_id,
          action:   "DEVICE_DETACHED_FOR_REUSE",
          targetId: device.id,
        },
      });
    });

    return { detached: true as const, deviceId: device.id };
  }

  /**
   * Révoque un appareil secondaire (l'appareil principal ne peut pas être révoqué).
   */
  async revokeDevice(userId: string, deviceId: string) {
    const device = await prisma.device.findFirst({ where: { id: deviceId, user_id: userId } });
    if (!device) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Appareil introuvable." };
    if (device.isPrimary) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "L'appareil principal ne peut pas être révoqué." };

    await prisma.$transaction(async (trx) => {
      await trx.chatMemberKey.deleteMany({ where: { device_id: deviceId } });
      await trx.device.update({ where: { id: deviceId }, data: { revokedAt: new Date() } });
      await trx.refreshToken.updateMany({ where: { device_id: deviceId }, data: { revokedAt: new Date() } });
      await trx.auditLog.create({ data: { user_id: userId, action: "DEVICE_REVOKED", targetId: deviceId } });
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) await this.mailer.sendSecurityAlert(user.email, "Appareil révoqué : " + device.name);
  }

  async rotateDeviceKey(
    userId: string,
    deviceId: string,
    payload: { newPublicKey: string; keySignature: string; chatKeyBundle: { chatId: string; encryptedKey: string }[] },
  ) {
    const ok = await verifyDeviceKeyAttestation(payload.newPublicKey, payload.keySignature);
    if (!ok) {
      throw { code: ErrorCode.INVALID_DEVICE_KEY, status: 400, message: "Clé publique ou signature invalide." };
    }

    const device = await prisma.device.findFirst({ where: { id: deviceId, user_id: userId, revokedAt: null } });
    if (!device) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Appareil introuvable." };

    const memberships = await prisma.conversationMember.findMany({
      where:   { user_id: userId },
      select:  { conversation_id: true },
    });
    const chatIds = [...new Set(memberships.map((m) => m.conversation_id))];

    for (const cid of chatIds) {
      if (!payload.chatKeyBundle.some((b) => b.chatId === cid)) {
        throw {
          code:    ErrorCode.VALIDATION_ERROR,
          status:  400,
          message: "Le lot de clés doit couvrir tous les chats dont vous êtes membre.",
        };
      }
    }

    const now = new Date();
    const keyExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (trx) => {
      await trx.device.update({
        where: { id: deviceId },
        data: {
          public_key:    payload.newPublicKey,
          key_signature: payload.keySignature,
          keyCreatedAt:  now,
          keyExpiresAt,
        },
      });

      for (const row of payload.chatKeyBundle) {
        await trx.chatMemberKey.updateMany({
          where: { chat_id: row.chatId, device_id: deviceId },
          data:  { encrypted_chat_key: row.encryptedKey },
        });
      }

      await trx.refreshToken.updateMany({
        where: { user_id: userId, device_id: deviceId, revokedAt: null },
        data:  { revokedAt: now },
      });

      await trx.auditLog.create({ data: { user_id: userId, action: "KEY_ROTATED", targetId: deviceId } });
    });
  }

  async updateFcmToken(deviceId: string, fcmToken: string) {
    await prisma.device.update({
      where: { id: deviceId },
      data: { fcm_token: fcmToken }
    });
  }
}
