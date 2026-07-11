import crypto from "node:crypto";
import zxcvbn from "zxcvbn";

import { prisma } from "../../config/database.js";
import { hash } from "../../config/hash.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";
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
    const strength = zxcvbn(payload.password);
    if (strength.score < 2) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Ce mot de passe est trop facile à deviner, essayez une combinaison moins courante." };
    }
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    const passwordHash = await hash.make(payload.password);
    
    let userId: string;

    if (existing) {
      if (existing.is_active) {
        throw { code: ErrorCode.EMAIL_TAKEN, status: 409, message: "Cet email est déjà utilisé." };
      } else {
        // Le compte existe mais n'a jamais été vérifié.
        // ATTENTION : On ne met plus à jour le mot de passe ici pour éviter qu'un attaquant 
        // n'écrase le mot de passe du propriétaire légitime avant vérification.
        userId = existing.id;
      }
    } else {
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
      userId = user.id;
    }

    await this.otp.sendOtp(userId, payload.email, "EMAIL_VERIFY");
    return { userId };
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
    fcmToken?: string;
    ip?: string;
    userAgent?: string;
    location?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    const valid = await hash.compare(payload.password, user.password);
    if (!valid) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    if (!user.is_active) throw { code: ErrorCode.ACCOUNT_NOT_VERIFIED, status: 403, message: "Veuillez vérifier votre email avant de vous connecter." };
    if (user.status === "DELETED" || user.isAnonymized) throw { code: ErrorCode.ACCOUNT_INACTIVE, status: 403, message: "Ce compte a été supprimé." };
    if (user.is_excluded) throw { code: ErrorCode.ACCOUNT_INACTIVE, status: 403, message: "Votre compte a été suspendu." };

    let deviceId: string | undefined;
    let requiresKeySetup = false;
    let keyRecoveryMode: "qr_required" | "key_recovery" | undefined;
    let keyBackup: { encrypted_key: string; salt: string } | undefined;

    if (user.is_configured && payload.deviceFingerprint) {
      const known = await prisma.device.findFirst({
        where: { user_id: user.id, fingerprint: payload.deviceFingerprint, revokedAt: null },
      });

      if (!known) {
        // It's a new device! Let's check active devices.
        const activeDevicesCount = await prisma.device.count({
          where: { user_id: user.id, revokedAt: null },
        });

        if (activeDevicesCount > 0) {
          keyRecoveryMode = "qr_required";
        } else {
          keyRecoveryMode = "key_recovery";
          const backup = await prisma.keyBackup.findUnique({ where: { user_id: user.id } });
          if (backup) {
            if (backup.lockedUntil && backup.lockedUntil > new Date()) {
              throw {
                code: ErrorCode.FORBIDDEN,
                status: 403,
                message: "Tentatives de récupération de clé épuisées. Veuillez contacter le support.",
              };
            }
            keyBackup = {
              encrypted_key: backup.encrypted_key,
              salt: backup.salt,
            };
          }
        }
      }
    }

    const loginMode = payload.loginMode ?? "primary";

    if (payload.deviceFingerprint && !keyRecoveryMode) {
      const known = await prisma.device.findFirst({
        where: { user_id: user.id, fingerprint: payload.deviceFingerprint, revokedAt: null },
      });

      if (known) {
        deviceId = known.id;
        if (!known.public_key) requiresKeySetup = true;
        
        // Mettre à jour le fcmToken s'il est fourni
        if (payload.fcmToken && known.fcm_token !== payload.fcmToken) {
          await prisma.device.update({
            where: { id: known.id },
            data: { fcm_token: payload.fcmToken, lastActiveAt: new Date() }
          });
        }
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
            fcm_token: payload.fcmToken ?? primary.fcm_token,
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

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "LOGIN",
        ip: payload.ip || null,
        userAgent: payload.userAgent || null,
        location: payload.location || null
      }
    });

    const tokens = await this._generateTokens(user, deviceId);
    return {
      ...tokens,
      requiresOnboarding: !user.is_configured,
      requiresKeySetup,
      keyRecoveryMode,
      keyBackup,
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
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      select: { id: true, device_id: true },
    });

    if (tokenRecord) {
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { revokedAt: new Date() },
        }),
        ...(tokenRecord.device_id
          ? [
              prisma.device.update({
                where: { id: tokenRecord.device_id },
                data: { fcm_token: null, revokedAt: new Date() },
              }),
            ]
          : []),
      ]);
    }
  }

  async logoutAll(userId: string) {
    const now = new Date();
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, revokedAt: null },
      data: { revokedAt: now },
    });
    await prisma.device.updateMany({
      where: { user_id: userId, revokedAt: null },
      data: { fcm_token: null, revokedAt: now },
    });
    await prisma.auditLog.create({ data: { user_id: userId, action: "LOGOUT" } });
  }

  async changePassword(userId: string, payload: { currentPassword: string; newPassword: string }) {
    const strength = zxcvbn(payload.newPassword);
    if (strength.score < 2) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Ce mot de passe est trop facile à deviner, essayez une combinaison moins courante." };
    }
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
    const strength = zxcvbn(payload.newPassword);
    if (strength.score < 2) {
      throw { code: ErrorCode.VALIDATION_ERROR, status: 400, message: "Ce mot de passe est trop facile à deviner, essayez une combinaison moins courante." };
    }
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
  previewPairing(query: { token?: string; shortCode?: string }) {
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
    options?: {
      ip?: string;
      userAgent?: string;
      location?: string;
    }
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
      const authorizedMemberships = await prisma.conversationMember.findMany({
        where: { user_id: userId, conversation_id: { in: chatIds } },
      });
      if (authorizedMemberships.length !== chatIds.length) {
        throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Chat non autorisé dans le lot de clés." };
      }
    }

    const consumed = consumePairingSession(session.token);
    if (!consumed) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Demande d'appairage déjà utilisée ou expirée." };
    }

    // Check device plan quota
    const activeDevicesCount = await prisma.device.count({
      where: { user_id: userId, revokedAt: null },
    });
    const subscription = await prisma.subscription.findUnique({ where: { user_id: userId } });
    const isPremium = subscription && subscription.status === "ACTIVE" && subscription.plan === "PREMIUM";
    const quota = isPremium ? 4 : 2;

    if (activeDevicesCount >= quota) {
      throw {
        code: ErrorCode.QUOTA_EXCEEDED,
        status: 403,
        message: `Quota d'appareils atteint (${quota} max pour le plan ${isPremium ? 'Premium' : 'Free'}).`,
      };
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

    // Send email alert for device linking
    const actionText = `Association d'un nouvel appareil effectuée.<br><br>` +
      `• Appareil : ${device.name} (${device.platform})<br>` +
      `• IP : ${options?.ip || "Inconnue"}<br>` +
      `• Localisation : ${options?.location || "Inconnue"}<br>` +
      `• Date : ${new Date().toLocaleString("fr-FR")}`;
    if (user.email) {
      await this.mailer.sendSecurityAlert(user.email, actionText);
    }
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

  async backupKey(userId: string, payload: { encryptedKey: string; salt: string }) {
    await prisma.keyBackup.upsert({
      where: { user_id: userId },
      update: {
        encrypted_key: payload.encryptedKey,
        salt: payload.salt,
        attemptsRemaining: 5,
        lockedUntil: null,
      },
      create: {
        user_id: userId,
        encrypted_key: payload.encryptedKey,
        salt: payload.salt,
        attemptsRemaining: 5,
      },
    });
    return { success: true };
  }

  async completeRecovery(
    userId: string,
    payload: {
      deviceName: string;
      devicePlatform: string;
      deviceFingerprint: string;
      devicePublicKey: string;
      deviceKeySignature: string;
      ip?: string;
      userAgent?: string;
      location?: string;
      isBypass?: boolean;
    }
  ) {
    const ok = await verifyDeviceKeyAttestation(payload.devicePublicKey, payload.deviceKeySignature);
    if (!ok) {
      throw { code: ErrorCode.INVALID_DEVICE_KEY, status: 400, message: "Clé publique ou signature d'appareil invalide." };
    }

    const now = new Date();
    const keyExpires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const otherActiveDevices = await prisma.device.findMany({
      where: { user_id: userId, revokedAt: null },
    });

    const result = await prisma.$transaction(async (trx) => {
      // Revoke all other active devices
      await trx.device.updateMany({
        where: { user_id: userId, revokedAt: null },
        data: { revokedAt: now },
      });

      // Revoke refresh tokens associated with this user
      await trx.refreshToken.updateMany({
        where: { user_id: userId, revokedAt: null },
        data: { revokedAt: now },
      });

      // Create new device and set as primary
      const device = await trx.device.create({
        data: {
          user_id: userId,
          name: payload.deviceName,
          platform: payload.devicePlatform,
          fingerprint: payload.deviceFingerprint,
          isPrimary: true,
          public_key: payload.devicePublicKey,
          key_signature: payload.deviceKeySignature,
          keyCreatedAt: now,
          keyExpiresAt: keyExpires,
        },
      });

      // Copy chat keys from any previous devices (propagate to the new device ID)
      const matchDevices = await trx.device.findMany({
        where: {
          user_id: userId,
          id: { not: device.id },
        },
        select: { id: true },
      });

      if (!payload.isBypass && matchDevices.length > 0) {
        const matchDeviceIds = matchDevices.map((d) => d.id);
        const oldKeys = await trx.chatMemberKey.findMany({
          where: { device_id: { in: matchDeviceIds } },
        });

        if (oldKeys.length > 0) {
          await trx.chatMemberKey.createMany({
            data: oldKeys.map((ok) => ({
              id: crypto.randomUUID(),
              chat_id: ok.chat_id,
              device_id: device.id,
              encrypted_chat_key: ok.encrypted_chat_key,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Reset attempts on KeyBackup
      await trx.keyBackup.updateMany({
        where: { user_id: userId },
        data: { attemptsRemaining: 5, lockedUntil: null },
      });

      // Create audit log for key recovery
      await trx.auditLog.create({
        data: {
          user_id: userId,
          action: "KEY_RECOVERY_TRIGGERED",
          targetId: device.id,
          ip: payload.ip || null,
          userAgent: payload.userAgent || null,
          location: payload.location || null,
        },
      });

      return device;
    });

    // Notify other active devices about revocation in real-time
    for (const d of otherActiveDevices) {
      RealtimeBus.emit(WsEventName.DeviceRevoked, { deviceId: d.id }, { userId });
    }

    // Send email alert for key recovery
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const actionText = `Récupération de clé de chiffrement effectuée.<br><br>` +
      `• Nouvel appareil principal : ${payload.deviceName} (${payload.devicePlatform})<br>` +
      `• IP : ${payload.ip || "Inconnue"}<br>` +
      `• Localisation : ${payload.location || "Inconnue"}<br>` +
      `• Date : ${now.toLocaleString("fr-FR")}`;
    if (user.email) {
      await this.mailer.sendSecurityAlert(user.email, actionText);
    }

    const tokens = await this._generateTokens(user, result.id);
    const expiresAtMs = tokens.expiresAt instanceof Date ? tokens.expiresAt.getTime() : Number(tokens.expiresAt);

    return {
      device: result,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: expiresAtMs,
      },
    };
  }

  async failedRecovery(userId: string) {
    const backup = await prisma.keyBackup.findUnique({ where: { user_id: userId } });
    if (!backup) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Aucune sauvegarde de clé trouvée pour cet utilisateur." };
    }

    const newAttempts = Math.max(0, backup.attemptsRemaining - 1);
    let lockedUntil: Date | null = null;
    if (newAttempts <= 0) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
    }

    await prisma.keyBackup.update({
      where: { id: backup.id },
      data: {
        attemptsRemaining: newAttempts <= 0 ? 5 : newAttempts, // reset to 5 if locked
        lockedUntil,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: "KEY_RECOVERY_FAILED_ATTEMPT",
      },
    });

    return {
      attemptsRemaining: newAttempts <= 0 ? 0 : newAttempts,
      lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
    };
  }
}
