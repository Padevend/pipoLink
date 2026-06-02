import { prisma } from "../../config/database.js";
import { FileService } from "./file.service.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { verifyDeviceKeyAttestation } from "../helpers/device-crypto.js";
import { AuthService } from "./auth.service.js";
import { DeviceService } from "./device.service.js";

export type OnboardingPayload = {
  firstname: string;
  lastname: string;
  username?: string;
  phone?: string;
  gender?: string;
  matricule?: string;
  niveau?: string;
  filiere?: string;
  bio?: string;
  deviceName: string;
  devicePlatform: string;
  deviceFingerprint: string;
  devicePublicKey: string;
  deviceKeySignature: string;
};

export class UserService {
  private fileService = new FileService();
  private authService = new AuthService();
  private deviceService = new DeviceService();

  async getMe(userId: string) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true,
        devices: { where: { revokedAt: null } },
      },
    });

    return user;
  }

  async getUser(userId: string, authUserId: string) {
    /**
     * option de recuperation de profil user
     * - recuperation des infos de base (id, username, matricule, email)
     * - recuperation des infos de profil (firstname, lastname, avatarUrl, niveau, filiere)
     * - recuperation des chats communs avec l'utilisateur (id, name, type)
     */
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        matricule: true,
        email: true,
        role: true,
        profile: true,
      }
    });

    if (!user) return null;

    const conversations = await prisma.chat.findMany({
      where: {
        AND: [
          { members: { some: { user_id: userId } } },
          { members: { some: { user_id: authUserId } } },
        ]
      }
    });

    return { ...user, conversations };
  }

  async completeOnboarding(userId: string, payload: OnboardingPayload) {
    const ok = await verifyDeviceKeyAttestation(payload.devicePublicKey, payload.deviceKeySignature);
    if (!ok) {
      throw { code: ErrorCode.INVALID_DEVICE_KEY, status: 400, message: "Clé publique ou signature d'appareil invalide." };
    }

    const otherUserDevice = await prisma.device.findFirst({
      where: {
        fingerprint: payload.deviceFingerprint,
        revokedAt: null,
        user_id: { not: userId },
      },
    });
    if (otherUserDevice) {
      await this.deviceService.detachDeviceByFingerprint(payload.deviceFingerprint);
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
            name: deviceName,
            platform: devicePlatform,
            public_key: devicePublicKey,
            key_signature: deviceKeySignature,
            keyCreatedAt: now,
            keyExpiresAt,
            revokedAt: null,
          },
        })
        : await trx.device.create({
          data: {
            user_id: userId,
            name: deviceName,
            platform: devicePlatform,
            fingerprint: deviceFingerprint,
            isPrimary: true,
            public_key: devicePublicKey,
            key_signature: deviceKeySignature,
            keyCreatedAt: now,
            keyExpiresAt,
          },
        });

      await trx.user.update({ where: { id: userId }, data: { is_configured: true, username } });

      const user = await trx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true, devices: { where: { revokedAt: null } } },
      });

      const tokens = await this.authService._generateTokens(user, device.id);
      const expiresAtMs = tokens.expiresAt instanceof Date ? tokens.expiresAt.getTime() : Number(tokens.expiresAt);

      return {
        user,
        device,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: expiresAtMs,
        },
      };
    });

    return result;
  }

  async searchUsers(requesterId: string, query: string) {
    const q = query.trim();

    const whereClause: any = {
      id: { not: requesterId },
      is_active: true,
      is_configured: true,
      is_excluded: false,
    };

    if (q.length > 0) {
      whereClause.OR = [
        { username: { contains: q, mode: "insensitive" } },
        { matricule: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { profile: { firstname: { contains: q, mode: "insensitive" } } },
        { profile: { lastname: { contains: q, mode: "insensitive" } } },
      ];
    }

    return prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        matricule: true,
        email: true,
        profile: {
          select: {
            firstname: true,
            lastname: true,
            avatarUrl: true,
            niveau: true,
            filiere: true,
          },
        },
      },
      take: 40,
      orderBy: { username: "asc" },
    });
  }

  async listDevicePublicKeys(targetUserId: string) {
    const devices = await prisma.device.findMany({
      where: { user_id: targetUserId, revokedAt: null, public_key: { not: null } },
      select: { id: true, public_key: true },
    });
    return devices.map((d) => ({ deviceId: d.id, publicKey: d.public_key as string }));
  }

  async updateProfile(userId: string, payload: Record<string, any>) {
    const { username, ...profile } = payload;

    try {
      await prisma.$transaction(async (trx) => {
        if (username !== undefined) {
          await trx.user.update({ where: { id: userId }, data: { username } });
        }

        await trx.userProfile.upsert({
          where: { user_id: userId },
          update: profile,
          create: { user_id: userId, firstname: profile.firstname ?? "", lastname: profile.lastname ?? "", ...profile },
        });
      });
    } catch (e) {
      console.error("Error updating profile:", e);
      throw { code: ErrorCode.INTERNAL_ERROR, status: 500, message: "Échec de la mise à jour du profil." };
    }
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

    await prisma.device.deleteMany({
      where: { user_id: userId }
    });

    await prisma.user.update({ where: { id: userId }, data: { is_excluded: true } });
    await prisma.auditLog.create({ data: { user_id: userId, action: "ACCOUNT_DELETED" } });
  }
}
