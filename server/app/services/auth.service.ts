import crypto from "node:crypto";

import { prisma } from "../../config/database.js";
import { hash } from "../../config/hash.js";
import { OtpService } from "./otp.service.js";
import { MailerService } from "./mailer.service.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";
import { verifyDeviceKeyAttestation } from "../helpers/device-crypto.js";
import {
  consumePairingSession,
  getPairingByShortCode,
  getPairingByToken,
  storePairingSession,
  type DevicePairingSession,
} from "../helpers/device-pairing-pending.js";
import { consumeQrLinkResult, storeQrLinkResult } from "../helpers/qr-link-pending.js";

export class AuthService {
  private otp = new OtpService();
  private mailer = new MailerService();

  async register(payload: { email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) throw { code: ErrorCode.EMAIL_TAKEN, status: 409, message: "Cet email est déjà utilisé." };

    const passwordHash = await hash.make(payload.password);

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        password: passwordHash,
        username: payload.email.split("@")[0],
        matricule: `STU-${Date.now()}`,
        role: "student",
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
    loginMode?: "primary" | "device";
  }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    const valid = await hash.compare(payload.password, user.password);
    if (!valid) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    if (!user.is_active) throw { code: ErrorCode.ACCOUNT_NOT_VERIFIED, status: 403, message: "Veuillez vérifier votre email avant de vous connecter." };
    if (user.is_excluded) throw { code: ErrorCode.ACCOUNT_INACTIVE, status: 403, message: "Votre compte a été suspendu." };

    let deviceId: string | undefined;
    let requiresKeySetup = false;

    const loginMode = payload.loginMode ?? "primary";

    if (payload.deviceFingerprint) {
      const known = await prisma.device.findFirst({
        where: { user_id: user.id, fingerprint: payload.deviceFingerprint, revokedAt: null },
      });

      if (known) {
        deviceId = known.id;
        if (!known.public_key) requiresKeySetup = true;
      } else if (!user.is_configured) {
        // Onboarding créera l'appareil principal
      } else if (loginMode === "primary") {
        const primary = await prisma.device.findFirst({
          where: { user_id: user.id, isPrimary: true, revokedAt: null },
        });
        if (!primary) {
          throw {
            code: ErrorCode.DEVICE_NOT_REGISTERED,
            status: 403,
            message: "Aucun appareil principal. Terminez la configuration du compte.",
          };
        }
        const updated = await prisma.device.update({
          where: { id: primary.id },
          data: {
            fingerprint: payload.deviceFingerprint,
            name: payload.deviceName ?? primary.name,
            platform: payload.devicePlatform ?? primary.platform,
            lastActiveAt: new Date(),
          },
        });
        deviceId = updated.id;
        if (!updated.public_key) requiresKeySetup = true;
      } else {
        throw {
          code: ErrorCode.DEVICE_NOT_REGISTERED,
          status: 403,
          message:
            "Cet appareil n'est pas associé à votre compte. Utilisez « Associer un appareil » depuis l'écran de connexion.",
        };
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
        data: { revokedAt: new Date() },
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
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, revokedAt: null },
      data: { revokedAt: new Date() },
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

  /** Appareil secondaire : démarre l'appairage sans jeton d'accès. */
  async initiateDevicePairing(payload: {
    deviceName: string;
    platform: string;
    fingerprint: string;
    publicKey: string;
    keySignature: string;
  }) {
    const attested = await verifyDeviceKeyAttestation(payload.publicKey, payload.keySignature);
    if (!attested) {
      throw { code: ErrorCode.INVALID_DEVICE_KEY, status: 400, message: "Clé publique ou signature invalide." };
    }

    const taken = await prisma.device.findFirst({
      where: { fingerprint: payload.fingerprint, revokedAt: null },
    });
    if (taken) {
      throw { code: ErrorCode.CONFLICT, status: 409, message: "Cet appareil est déjà enregistré." };
    }

    const token = hash.generateRandomString(32);
    const shortCode = hash.generateRandomString(6, "numeric");
    const expiresAt = DateTime.utc().plus({ minutes: 5 }).toMillis();

    const session: DevicePairingSession = {
      token,
      shortCode,
      deviceName: payload.deviceName,
      platform: payload.platform,
      fingerprint: payload.fingerprint,
      publicKey: payload.publicKey,
      keySignature: payload.keySignature,
      expiresAt,
    };
    storePairingSession(session);

    return {
      token,
      shortCode,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /** Appareil principal : récupère les infos d'une demande avant approbation (code manuel). */
  previewPairing(userId: string, query: { token?: string; shortCode?: string }) {
    if (!query.token && !query.shortCode) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "token ou shortCode requis." };
    }
    const session = query.token
      ? getPairingByToken(query.token)
      : getPairingByShortCode(query.shortCode!);
    if (!session) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Demande introuvable ou expirée." };
    }
    return {
      token: session.token,
      shortCode: session.shortCode,
      deviceName: session.deviceName,
      platform: session.platform,
      publicKey: session.publicKey,
      expiresAt: new Date(session.expiresAt).toISOString(),
    };
  }

  /** Appareil principal connecté : approuve l'appairage (scan QR ou code manuel). */
  async approveDevicePairing(
    userId: string,
    payload: {
      token?: string;
      shortCode?: string;
      chatKeyBundle?: { chatId: string; encryptedKey: string }[];
    },
  ) {
    if (!payload.token && !payload.shortCode) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "token ou shortCode requis." };
    }

    const primary = await prisma.device.findFirst({
      where: { user_id: userId, isPrimary: true, revokedAt: null },
    });
    if (!primary) {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Seul l'appareil principal peut approuver un nouvel appareil." };
    }

    const session = payload.token
      ? getPairingByToken(payload.token)
      : getPairingByShortCode(payload.shortCode!);
    if (!session) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Demande d'appairage introuvable ou expirée." };
    }

    if (payload.chatKeyBundle?.length) {
      const chatIds = [...new Set(payload.chatKeyBundle.map((b) => b.chatId))];
      for (const chatId of chatIds) {
        const member = await prisma.conversationMember.findFirst({
          where: { conversation_id: chatId, user_id: userId },
        });
        if (!member) {
          throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Chat non autorisé dans le lot de clés." };
        }
      }
    }

    const consumed = consumePairingSession(session.token);
    if (!consumed) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Demande d'appairage déjà utilisée ou expirée." };
    }

    const now = new Date();
    const keyExpires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const device = await prisma.device.create({
      data: {
        user_id: userId,
        name: consumed.deviceName,
        platform: consumed.platform,
        fingerprint: consumed.fingerprint,
        isPrimary: false,
        public_key: consumed.publicKey,
        key_signature: consumed.keySignature,
        keyCreatedAt: now,
        keyExpiresAt: keyExpires,
      },
    });

    if (payload.chatKeyBundle?.length) {
      await prisma.chatMemberKey.createMany({
        data: payload.chatKeyBundle.map((row) => ({
          id: crypto.randomUUID(),
          chat_id: row.chatId,
          device_id: device.id,
          encrypted_chat_key: row.encryptedKey,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.auditLog.create({ data: { user_id: userId, action: "DEVICE_LINKED" } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const tokens = await this._generateTokens(user, device.id);
    const expiresAtMs = tokens.expiresAt instanceof Date ? tokens.expiresAt.getTime() : Number(tokens.expiresAt);
    const linkResult = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: expiresAtMs,
      deviceId: device.id,
      user: { id: user.id, email: user.email, username: user.username, role: user.role, is_configured: user.is_configured },
      device: { id: device.id, name: device.name, platform: device.platform },
    };
    storeQrLinkResult(consumed.token, linkResult);
    return { device, user: linkResult.user };
  }

  /** Phase 4 workflow 7 : le nouvel appareil récupère ses jetons après validation par l'appareil principal. */
  pollQrLink(token: string) {
    const result = consumeQrLinkResult(token);
    if (!result) {
      return { status: "pending" as const };
    }
    return { status: "completed" as const, tokens: result };
  }

  public async _generateTokens(user: any, deviceId?: string) {
    const accessToken = await hash.jwt.encode({
      sub: user.id,
      deviceId: deviceId ?? null,
      role: user.role,
      is_configured: user.is_configured,
    });
    const rawRefreshToken = hash.generateRandomString(64);
    const tokenHash = await hash.sha512(rawRefreshToken);
    const expiresAt = DateTime.utc().plus({ days: 30 }).toJSDate();

    let resolvedDeviceId: string | null = null;

    if (deviceId) {
      const exists = await prisma.device.findUnique({
        where: { id: deviceId },
        select: { id: true },
      });
      resolvedDeviceId = exists?.id ?? null;
    }

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        device_id: resolvedDeviceId,
        tokenHash, expiresAt
      },
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
