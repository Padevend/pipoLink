import { prisma }      from "../../config/database.js";
import { MailerService } from "./mailer.service.js";
import { ErrorCode }   from "../helpers/error-codes.js";

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
   * Révoque un appareil spécifique.
   * - Interdit la révocation de l'appareil principal
   * - Révoque les refresh tokens associés
   * - Envoie un email d'alerte sécurité
   *
   * @param userId   - Identifiant de l'utilisateur
   * @param deviceId - Identifiant de l'appareil à révoquer
   */
  async revokeDevice(userId: string, deviceId: string) {
    const device = await prisma.device.findFirst({ where: { id: deviceId, user_id: userId } });
    if (!device) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Appareil introuvable." };
    if (device.isPrimary) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "L'appareil principal ne peut pas être révoqué." };

    await prisma.device.update({ where: { id: deviceId }, data: { revokedAt: new Date() } });
    await prisma.refreshToken.updateMany({ where: { device_id: deviceId }, data: { revokedAt: new Date() } });
    await prisma.auditLog.create({ data: { user_id: userId, action: "DEVICE_REVOKED", targetId: deviceId } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) await this.mailer.sendSecurityAlert(user.email, "Appareil révoqué : " + device.name);
  }
}
