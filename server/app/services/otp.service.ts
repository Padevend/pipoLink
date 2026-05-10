import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";
import { MailerService } from "./mailer.service.js";
import { hash } from "../../config/hash.js";

/**
 * Service de gestion des OTP (One Time Password).
 */
export class OtpService {
  private mailer = new MailerService();

  /**
   * Génère et envoie un OTP.
   * Vérifie le cooldown de 60 secondes.
   *
   * @param userId - ID utilisateur
   * @param email - Email
   * @param purpose - EMAIL_VERIFY ou PASSWORD_RESET
   */
  async sendOtp(userId: string, email: string, purpose: string) {
    const existing = await prisma.otp.findFirst({
      where: { user_id: userId, purpose },
      orderBy: { createdAt: "desc" }
    });

    if (existing && DateTime.fromJSDate(existing.createdAt).plus({ seconds: 60 }) > DateTime.now()) {
      throw { code: ErrorCode.OTP_COOLDOWN, status: 429, message: "Veuillez patienter avant de demander un nouveau code." };
    }

    const code = hash.generateRandomString(6, "numeric");
    const expiresAt = DateTime.now().plus({ minutes: 15 }).toJSDate();

    await prisma.otp.create({
      data: { user_id: userId, code, purpose, expiresAt }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (purpose === "EMAIL_VERIFY") {
      await this.mailer.sendVerification(email, code, user?.username || "Utilisateur");
    } else if (purpose === "PASSWORD_RESET") {
      await this.mailer.sendPasswordReset(email, code);
    }
  }

  /**
   * Vérifie un OTP.
   *
   * @param userId - ID utilisateur
   * @param code - Code OTP
   * @param purpose - EMAIL_VERIFY ou PASSWORD_RESET
   */
  async verifyOtp(userId: string, code: string, purpose: string) {
    const otp = await prisma.otp.findFirst({
      where: { user_id: userId, purpose },
      orderBy: { createdAt: "desc" }
    });

    if (!otp) throw { code: ErrorCode.INVALID_OTP, status: 400, message: "Code OTP invalide." };

    if (otp.attempts >= 3) {
      throw { code: ErrorCode.OTP_ATTEMPTS_EXCEEDED, status: 400, message: "Trop de tentatives échouées." };
    }

    if (DateTime.now() > DateTime.fromJSDate(otp.expiresAt)) {
      throw { code: ErrorCode.EXPIRED_OTP, status: 400, message: "Le code OTP a expiré." };
    }

    if (otp.code !== code) {
      await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      throw { code: ErrorCode.INVALID_OTP, status: 400, message: "Code OTP incorrect." };
    }

    await prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  }
}
