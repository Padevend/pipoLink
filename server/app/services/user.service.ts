import { prisma } from "../../config/database.js";
import { FileService } from "./file.service.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { verifyDeviceKeyAttestation } from "../helpers/device-crypto.js";

export type OnboardingPayload = {
  firstname: string;
  lastname: string;
  username?: string;
  phone?: string;
  gender?: string;
  matricule?: string;
  niveau?: string;
  filiere?: string;
  deviceName: string;
  devicePlatform: string;
  deviceFingerprint: string;
  devicePublicKey: string;
  deviceKeySignature: string;
};

export class UserService {
  private fileService = new FileService();

  async getMe(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true,
        devices: { where: { revokedAt: null } },
      },
    });
  }

  async completeOnboarding(userId: string, payload: OnboardingPayload) {
    const ok = await verifyDeviceKeyAttestation(payload.devicePublicKey, payload.deviceKeySignature);
    if (!ok) {
      throw { code: ErrorCode.INVALID_DEVICE_KEY, status: 400, message: "Clé publique ou signature d'appareil invalide." };
    }

    const otherUserDevice = await prisma.device.findFirst({
      where: {
        fingerprint: payload.deviceFingerprint,
        revokedAt:   null,
        user_id:     { not: userId },
      },
    });
    if (otherUserDevice) {
      throw { code: ErrorCode.CONFLICT, status: 409, message: "Cet appareil est déjà enregistré sur un autre compte." };
    }

    const now = new Date();
    const keyExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const { deviceName, devicePlatform, deviceFingerprint, devicePublicKey, deviceKeySignature, username, ...profile } = payload;

    const result = await prisma.$transaction(async (trx) => {
      await trx.userProfile.upsert({
        where: { user_id: userId },
        update: profile,
        create: { user_id: userId, ...profile },
      });

      const existing = await trx.device.findFirst({
        where: { user_id: userId, fingerprint: deviceFingerprint, revokedAt: null },
      });

      const device = existing
        ? await trx.device.update({
            where: { id: existing.id },
            data: {
              name:          deviceName,
              platform:      devicePlatform,
              public_key:    devicePublicKey,
              key_signature: deviceKeySignature,
              keyCreatedAt:  now,
              keyExpiresAt,
              revokedAt:     null,
            },
          })
        : await trx.device.create({
            data: {
              user_id:       userId,
              name:          deviceName,
              platform:      devicePlatform,
              fingerprint:   deviceFingerprint,
              isPrimary:     true,
              public_key:    devicePublicKey,
              key_signature: deviceKeySignature,
              keyCreatedAt:  now,
              keyExpiresAt,
            },
          });

      await trx.user.update({ where: { id: userId }, data: { is_configured: true, username } });

      const user = await trx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true, devices: { where: { revokedAt: null } } },
      });

      return { user, device };
    });

    return result;
  }

  async listDevicePublicKeys(targetUserId: string) {
    const devices = await prisma.device.findMany({
      where:   { user_id: targetUserId, revokedAt: null, public_key: { not: null } },
      select:  { id: true, public_key: true },
    });
    return devices.map((d) => ({ deviceId: d.id, publicKey: d.public_key as string }));
  }

  async updateProfile(userId: string, payload: Record<string, any>) {
    await prisma.userProfile.upsert({
      where: { user_id: userId },
      update: payload,
      create: { user_id: userId, firstname: "", lastname: "", ...payload },
    });
  }

  async uploadAvatar(userId: string, file: Buffer) {
    const url = await this.fileService.processAvatar(userId, file);
    await prisma.userProfile.upsert({
      where: { user_id: userId },
      update: { avatarUrl: url },
      create: { user_id: userId, firstname: "", lastname: "", avatarUrl: url },
    });
    return { avatarUrl: url };
  }

  async deleteAccount(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { revokedAt: new Date() },
    });
    await prisma.user.update({ where: { id: userId }, data: { is_excluded: true } });
    await prisma.auditLog.create({ data: { user_id: userId, action: "ACCOUNT_DELETED" } });
  }
}
