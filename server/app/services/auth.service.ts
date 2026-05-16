import crypto from "node:crypto";

import { prisma } from "../../config/database.js";
import { hash }   from "../../config/hash.js";
import { OtpService } from "./otp.service.js";
import { MailerService } from "./mailer.service.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";
import { verifyDeviceKeyAttestation } from "../helpers/device-crypto.js";
import { consumeQrLinkResult, storeQrLinkResult } from "../helpers/qr-link-pending.js";

export class AuthService {
  private otp    = new OtpService();
  private mailer = new MailerService();

  async register(payload: { email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) throw { code: ErrorCode.EMAIL_TAKEN, status: 409, message: "Cet email est déjà utilisé." };

    const passwordHash = await hash.make(payload.password);

    const user = await prisma.user.create({
      data: {
        email:    payload.email,
        password: passwordHash,
        username: payload.email.split("@")[0],
        matricule: `STU-${Date.now()}`,
        public_key: "",
        role:      "student",
        is_active: false,
      },
    });

    await this.otp.sendOtp(user.id, user.email!, "EMAIL_VERIFY");
    return { userId: user.id };
  }

  async verifyOtp(payload: { email: string; code: string; purpose: string }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Utilisateur introuvable." };

    await this.otp.verifyOtp(user.id, payload.code, payload.purpose);

    if (payload.purpose === "EMAIL_VERIFY") {
      await prisma.user.update({ where: { id: user.id }, data: { is_active: true } });
      const tokens = await this._generateTokens(user);
      return { ...tokens, requiresOnboarding: !user.is_configured };
    }
    return null;
  }

  async resendOtp(payload: { email: string; purpose: string }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) return;
    await this.otp.sendOtp(user.id, user.email!, payload.purpose);
  }

  async login(payload: {
    email: string;
    password: string;
    deviceFingerprint?: string;
    deviceName?: string;
    devicePlatform?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    const valid = await hash.compare(payload.password, user.password);
    if (!valid) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    if (!user.is_active) throw { code: ErrorCode.ACCOUNT_NOT_VERIFIED, status: 403, message: "Veuillez vérifier votre email avant de vous connecter." };
    if (user.is_excluded) throw { code: ErrorCode.ACCOUNT_INACTIVE, status: 403, message: "Votre compte a été suspendu." };

    let deviceId: string | undefined;
    let requiresKeySetup = false;

    if (payload.deviceFingerprint) {
      let device = await prisma.device.findFirst({
        where: { user_id: user.id, fingerprint: payload.deviceFingerprint, revokedAt: null },
      });

      if (!device && user.is_configured) {
        device = await prisma.device.create({
          data: {
            user_id:     user.id,
            name:        payload.deviceName ?? "Appareil",
            platform:    payload.devicePlatform ?? "unknown",
            fingerprint: payload.deviceFingerprint,
            isPrimary:   false,
          },
        });
        requiresKeySetup = true;
      }

      if (device) {
        deviceId = device.id;
        if (!device.public_key) requiresKeySetup = true;
      }
    }

    await prisma.auditLog.create({ data: { user_id: user.id, action: "LOGIN" } });

    const tokens = await this._generateTokens(user, deviceId);
    return {
      ...tokens,
      requiresOnboarding: !user.is_configured,
      requiresKeySetup,
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = await hash.sha512(refreshToken);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!record) throw { code: ErrorCode.TOKEN_REVOKED, status: 401, message: "Token invalide." };

    if (record.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { user_id: record.user_id },
        data:  { revokedAt: new Date() },
      });
      throw { code: ErrorCode.TOKEN_REUSE_DETECTED, status: 401, message: "Session compromise. Reconnectez-vous." };
    }

    if (new Date() > record.expiresAt) throw { code: ErrorCode.TOKEN_EXPIRED, status: 401, message: "Token expiré. Reconnectez-vous." };

    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: record.user_id } });
    return await this._generateTokens(user, record.device_id ?? undefined);
  }

  async logout(refreshToken: string) {
    const tokenHash = await hash.sha512(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data:  { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, revokedAt: null },
      data:  { revokedAt: new Date() },
    });
    await prisma.auditLog.create({ data: { user_id: userId, action: "LOGOUT" } });
  }

  async changePassword(userId: string, payload: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await hash.compare(payload.currentPassword, user.password);
    if (!valid) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Mot de passe actuel incorrect." };

    const newHash = await hash.make(payload.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: newHash } });
    await this.logoutAll(userId);

    await prisma.auditLog.create({ data: { user_id: userId, action: "PASSWORD_CHANGED" } });
    if (user.email) await this.mailer.sendSecurityAlert(user.email, "Changement de mot de passe");
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.email) return;
    await this.otp.sendOtp(user.id, user.email, "PASSWORD_RESET");
  }

  async resetPassword(payload: { email: string; code: string; newPassword: string }) {
    await this.verifyOtp({ email: payload.email, code: payload.code, purpose: "PASSWORD_RESET" });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: payload.email } });
    const newHash = await hash.make(payload.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
    await this.logoutAll(user.id);
  }

  async generateQrToken(userId: string) {
    const token     = hash.generateRandomString(32);
    const expiresAt = DateTime.utc().plus({ seconds: 120 }).toJSDate();
    await prisma.qrToken.create({ data: { user_id: userId, token, expiresAt } });
    return { token, expiresAt };
  }

  async verifyQrToken(payload: {
    token: string;
    deviceName: string;
    platform: string;
    fingerprint: string;
    newDevice?: { publicKey: string; keySignature: string };
    chatKeyBundle?: { chatId: string; encryptedKey: string }[];
  }) {
    const record = await prisma.qrToken.findUnique({ where: { token: payload.token } });
    if (!record || record.usedAt || new Date() > record.expiresAt) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Token QR invalide ou expiré." };
    }
    await prisma.qrToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    if (payload.chatKeyBundle?.length) {
      if (!payload.newDevice?.publicKey || !payload.newDevice?.keySignature) {
        throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "newDevice requis avec le lot de clés de chat." };
      }
      const attested = await verifyDeviceKeyAttestation(
        payload.newDevice.publicKey,
        payload.newDevice.keySignature,
      );
      if (!attested) {
        throw { code: ErrorCode.INVALID_DEVICE_KEY, status: 400, message: "Signature du nouvel appareil invalide." };
      }
      const chatIds = [...new Set(payload.chatKeyBundle.map((b) => b.chatId))];
      for (const chatId of chatIds) {
        const member = await prisma.conversationMember.findFirst({
          where: { conversation_id: chatId, user_id: record.user_id },
        });
        if (!member) {
          throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Chat non autorisé dans le lot de clés." };
        }
      }
    } else if (payload.newDevice?.publicKey) {
      const attested = await verifyDeviceKeyAttestation(
        payload.newDevice.publicKey,
        payload.newDevice.keySignature ?? "",
      );
      if (!attested) {
        throw { code: ErrorCode.INVALID_DEVICE_KEY, status: 400, message: "Signature du nouvel appareil invalide." };
      }
    }

    const existingCount = await prisma.device.count({ where: { user_id: record.user_id, revokedAt: null } });
    const now = new Date();
    const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const device = await prisma.device.create({
      data: {
        user_id:       record.user_id,
        name:          payload.deviceName,
        platform:      payload.platform,
        fingerprint:   payload.fingerprint,
        isPrimary:     existingCount === 0,
        public_key:    payload.newDevice?.publicKey ?? null,
        key_signature: payload.newDevice?.keySignature ?? null,
        keyCreatedAt:  payload.newDevice?.publicKey ? now : null,
        keyExpiresAt:  payload.newDevice?.publicKey ? expires : null,
      },
    });

    if (payload.chatKeyBundle?.length) {
      await prisma.chatMemberKey.createMany({
        data: payload.chatKeyBundle.map((row) => ({
          id:                 crypto.randomUUID(),
          chat_id:            row.chatId,
          device_id:          device.id,
          encrypted_chat_key: row.encryptedKey,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.auditLog.create({ data: { user_id: record.user_id, action: "DEVICE_LINKED" } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: record.user_id } });
    const tokens = await this._generateTokens(user, device.id);
    const expiresAtMs = tokens.expiresAt instanceof Date ? tokens.expiresAt.getTime() : Number(tokens.expiresAt);
    const linkResult = {
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt:    expiresAtMs,
      deviceId:     device.id,
      user:         { id: user.id, email: user.email, username: user.username, role: user.role },
      device:       { id: device.id, name: device.name, platform: device.platform },
    };
    storeQrLinkResult(payload.token, linkResult);
    return linkResult;
  }

  /** Phase 4 workflow 7 : le nouvel appareil récupère ses jetons après validation par l'appareil principal. */
  pollQrLink(token: string) {
    const result = consumeQrLinkResult(token);
    if (!result) {
      return { status: "pending" as const };
    }
    return { status: "completed" as const, tokens: result };
  }

  private async _generateTokens(user: any, deviceId?: string) {
    const accessToken = await hash.jwt.encode({
      sub:             user.id,
      deviceId:        deviceId ?? null,
      role:            user.role,
      is_configured:   user.is_configured,
    });
    const rawRefreshToken = hash.generateRandomString(64);
    const tokenHash       = await hash.sha512(rawRefreshToken);
    const expiresAt       = DateTime.utc().plus({ days: 30 }).toJSDate();

    await prisma.refreshToken.create({
      data: { user_id: user.id, device_id: deviceId ?? null, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresAt,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      deviceId: deviceId ?? null,
    };
  }
}
