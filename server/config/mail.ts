import { env } from "./envManager.js";

/**
 * Configuration Nodemailer pour Gmail SMTP.
 * Utilisé par MailerService pour tous les envois d'emails.
 */
export const mailConfig = {
  host:   env.get("MAIL_HOST"),
  port:   env.get("MAIL_PORT"),
  secure: false,
  auth: {
    user: env.get("MAIL_USER"),
    pass: env.get("MAIL_PASS"),
  },
  from: {
    name:    env.get("MAIL_FROM_NAME"),
    address: env.get("MAIL_FROM_ADDRESS"),
  },
};
