import nodemailer from "nodemailer";
import { mailConfig } from "../../config/mail.js";
import fs from "fs";
import path from "path";

/**
 * Service d'envoi d'emails via Nodemailer + Gmail SMTP.
 * Tous les envois sont asynchrones et non-bloquants.
 * Les échecs sont loggés mais ne font jamais échouer la requête appelante.
 */
export class MailerService {
  private transporter = nodemailer.createTransport(mailConfig as any);

  /**
   * Envoie un email de vérification contenant l'OTP.
   *
   * @param to       - Adresse email du destinataire
   * @param otp      - Code OTP en clair (6 chiffres)
   * @param username - Nom d'utilisateur pour personnaliser l'email
   */
  async sendVerification(to: string, otp: string, username: string) {
    const html = this._loadTemplate("verification", { otp, username });
    await this._send(to, "Vérifiez votre adresse email — PipoLink", html);
  }

  /**
   * Envoie un email de réinitialisation de mot de passe.
   *
   * @param to  - Adresse email du destinataire
   * @param otp - Code OTP de reset
   */
  async sendPasswordReset(to: string, otp: string) {
    const html = this._loadTemplate("reset-password", { otp });
    await this._send(to, "Réinitialisez votre mot de passe — PipoLink", html);
  }

  /**
   * Envoie un email d'alerte de sécurité.
   *
   * @param to     - Adresse email du destinataire
   * @param action - Description de l'action (ex: 'Changement de mot de passe')
   */
  async sendSecurityAlert(to: string, action: string) {
    const html = this._loadTemplate("security-alert", { action, date: new Date().toLocaleString("fr-FR") });
    await this._send(to, "Alerte de sécurité — PipoLink", html);
  }

  /**
   * Envoie un email de rappel d'expiration d'abonnement.
   *
   * @param to        - Adresse email du destinataire
   * @param expiresAt - Date d'expiration de l'abonnement
   */
  async sendSubscriptionReminder(to: string, expiresAt: Date) {
    const html = this._loadTemplate("subscription-reminder", {
      expiresAt: expiresAt.toLocaleDateString("fr-FR"),
    });
    await this._send(to, "Votre abonnement PipoLink expire bientôt", html);
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Envoie un email via le transporteur Nodemailer.
   * Catch silencieux : les échecs d'envoi ne remontent pas d'erreur.
   */
  private async _send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from:    `"${mailConfig.from.name}" <${mailConfig.from.address}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error(`[MailerService] Échec envoi email vers ${to} :`, err);
    }
  }

  /**
   * Charge un template HTML et remplace les variables {{variable}}.
   *
   * @param name      - Nom du fichier template (sans .html)
   * @param variables - Variables à injecter dans le template
   */
  private _loadTemplate(name: string, variables: Record<string, string>): string {
    const filePath = path.join(process.cwd(), "src", "templates", `${name}.html`);
    let html = fs.readFileSync(filePath, "utf-8");

    for (const [key, value] of Object.entries(variables)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }

    return html;
  }
}
