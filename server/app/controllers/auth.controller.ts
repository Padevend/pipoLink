import { HttpContext } from "../../config/app.js";
import { AuthService } from "../services/auth.service.js";
import { DeviceService } from "../services/device.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { setCookie, deleteCookie } from "hono/cookie";
import {
  registerValidator, loginValidator, verifyOtpValidator,
  resendOtpValidator, changePasswordValidator,
  resetPasswordValidator, refreshValidator,
  initiatePairingValidator, approvePairingValidator,
  backupKeyValidator, completeRecoveryValidator,
} from "../validators/auth.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";
import { getConnInfo } from "@hono/node-server/conninfo";

export class AuthController {
  private service = new AuthService();
  private devices = new DeviceService();

  async register(c: HttpContext) {
    const payload = await c.validateUsing(registerValidator);
    const result  = await this.service.register(payload);
    return ApiResponse.success(c, result, "Compte créé. Vérifiez votre email.", 201);
  }

  async verifyOtp(c: HttpContext) {
    const payload = await c.validateUsing(verifyOtpValidator);
    const result  = await this.service.verifyOtp(payload);
    return ApiResponse.success(c, result, "Vérification réussie.");
  }

  async resendOtp(c: HttpContext) {
    const payload = await c.validateUsing(resendOtpValidator);
    await this.service.resendOtp(payload);
    return ApiResponse.success(c, null, "Un nouveau code a été envoyé.");
  }

  async login(c: HttpContext) {
    const payload = await c.validateUsing(loginValidator);
    
    const userAgent = c.req.header("user-agent") || "Inconnu";
    let ip = "127.0.0.1";
    try {
      const conn = getConnInfo(c);
      ip = conn.remote.address || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    } catch (e) {
      ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    }

    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    const { getLocationFromIp } = await import("../helpers/ip-lookup.js");
    const location = await getLocationFromIp(ip);

    const result  = await this.service.login({
      ...payload,
      ip,
      userAgent,
      location,
    });

    // Enforce HTTPOnly cookie secure storage for sensitive credentials
    setCookie(c, "pipolink_admin_token", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return ApiResponse.success(c, result, "Connexion réussie.");
  }

  async refresh(c: HttpContext) {
    const payload = await c.validateUsing(refreshValidator);
    const result  = await this.service.refreshTokens(payload.refreshToken);
    return ApiResponse.success(c, result, "Tokens actualisés.");
  }

  async logout(c: HttpContext) {
    try {
      const payload = await c.req.json().catch(() => ({}));
      if (payload && payload.refreshToken) {
        await this.service.logout(payload.refreshToken);
      }
    } catch (e) {
      // safe fallback if JSON parse fails or token cannot be revoked
    }
    deleteCookie(c, "pipolink_admin_token", {
      path: "/",
      secure: true,
      sameSite: "None",
    });
    return ApiResponse.success(c, null, "Déconnexion réussie.");
  }

  async logoutAll(c: HttpContext) {
    const userId = c.get("userId") as string;
    await this.service.logoutAll(userId);
    return ApiResponse.success(c, null, "Déconnecté de tous les appareils.");
  }

  async changePassword(c: HttpContext) {
    const userId  = c.get("userId") as string;
    const payload = await c.validateUsing(changePasswordValidator);
    await this.service.changePassword(userId, payload);
    return ApiResponse.success(c, null, "Mot de passe modifié avec succès.");
  }

  async forgotPassword(c: HttpContext) {
    let { email } = await c.req.json();
    if (typeof email === "string") {
      email = email.trim().toLowerCase();
    }
    await this.service.forgotPassword(email).catch(() => {});
    return ApiResponse.success(c, null, "Si cet email existe, un code vous a été envoyé.");
  }

  async resetPassword(c: HttpContext) {
    const payload = await c.validateUsing(resetPasswordValidator);
    await this.service.resetPassword(payload);
    return ApiResponse.success(c, null, "Mot de passe réinitialisé avec succès.");
  }

  /** Appareil secondaire — sans authentification. */
  async initiatePairing(c: HttpContext) {
    const payload = await c.validateUsing(initiatePairingValidator);
    const result  = await this.service.initiateDevicePairing(payload);
    return ApiResponse.success(c, result, "Demande d'appairage créée.", 201);
  }

  async previewPairing(c: HttpContext) {
    const token = c.req.query("token");
    const shortCode = c.req.query("shortCode");
    const result = this.service.previewPairing({
      token: token ?? undefined,
      shortCode: shortCode ?? undefined,
    });
    return ApiResponse.success(c, result, "Demande d'appairage.");
  }

  /** Appareil principal connecté — scan QR ou saisie du code. */
  async approvePairing(c: HttpContext) {
    const userId  = c.get("userId") as string;
    const payload = await c.validateUsing(approvePairingValidator);

    const userAgent = c.req.header("user-agent") || "Inconnu";
    let ip = "127.0.0.1";
    try {
      const conn = getConnInfo(c);
      ip = conn.remote.address || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    } catch (e) {
      ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    }
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    const { getLocationFromIp } = await import("../helpers/ip-lookup.js");
    const location = await getLocationFromIp(ip);

    const result  = await this.service.approveDevicePairing(userId, payload, { ip, userAgent, location });
    RealtimeBus.emit(WsEventName.DeviceLinked, result.device, { userId });
    return ApiResponse.success(c, { device: result.device }, "Appareil secondaire approuvé.", 201);
  }

  async detachDeviceByFingerprint(c: HttpContext) {
    const { fingerprint } = await c.req.json();
    if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length < 4) {
      return ApiResponse.error(c, "VALIDATION_ERROR", "fingerprint requis.", 400);
    }
    const result = await this.devices.detachDeviceByFingerprint(fingerprint);
    return ApiResponse.success(c, result, result.detached ? "Appareil détaché." : "Aucun appareil actif à détacher.");
  }

  async pollQrLink(c: HttpContext) {
    const token = c.req.query("token");
    if (!token) {
      return ApiResponse.error(c, "VALIDATION_ERROR", "token requis.", 400);
    }
    const result = this.service.pollQrLink(token);
    return ApiResponse.success(c, result, result.status === "completed" ? "Liaison terminée." : "En attente.");
  }

  async backupKey(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(backupKeyValidator);
    const result = await this.service.backupKey(userId, payload);
    return ApiResponse.success(c, result, "Sauvegarde de clé réussie.");
  }

  async completeRecovery(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(completeRecoveryValidator);
    
    const userAgent = c.req.header("user-agent") || "Inconnu";
    let ip = "127.0.0.1";
    try {
      const conn = getConnInfo(c);
      ip = conn.remote.address || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    } catch (e) {
      ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    }

    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    const { getLocationFromIp } = await import("../helpers/ip-lookup.js");
    const location = await getLocationFromIp(ip);

    const result = await this.service.completeRecovery(userId, {
      ...payload,
      ip,
      userAgent,
      location,
    });
    return ApiResponse.success(c, result, "Récupération de clé terminée.");
  }

  async failedRecovery(c: HttpContext) {
    const userId = c.get("userId") as string;
    const result = await this.service.failedRecovery(userId);
    return ApiResponse.success(c, result, "Tentative échouée enregistrée.");
  }
}
