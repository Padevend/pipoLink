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

    // Ne pas exposer les comptes supprimés via getUser
    if (user.email?.endsWith("@deleted.local")) return null;

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

      // If a new device is created, copy existing chat keys from any previous devices
      if (!existing) {
        const matchDevices = await trx.device.findMany({
          where: {
            user_id: userId,
            id: { not: device.id },
          },
          select: { id: true },
        });

        if (matchDevices.length > 0) {
          const matchDeviceIds = matchDevices.map((d) => d.id);
          const oldKeys = await trx.chatMemberKey.findMany({
            where: { device_id: { in: matchDeviceIds } },
          });

          if (oldKeys.length > 0) {
            await trx.chatMemberKey.createMany({
              data: oldKeys.map((ok) => ({
                chat_id: ok.chat_id,
                device_id: device.id,
                encrypted_chat_key: ok.encrypted_chat_key,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      await trx.user.update({ where: { id: userId }, data: { is_configured: true, username } });

      const user = await trx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true, devices: { where: { revokedAt: null } } },
      });

      const tokens = await this.authService._generateTokens(user, device.id);
      const expiresAtMs = tokens.expiresAt instanceof Date ? tokens.expiresAt.getTime() : Number(tokens.expiresAt);

      // create subscription safely (upsert)
      await trx.subscription.upsert({
        where: { user_id: userId },
        update: {},
        create: {
          user_id: userId,
          plan: "FREE",
          status: "ACTIVE",
        },
      });

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
      isAnonymized: false,
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
}
