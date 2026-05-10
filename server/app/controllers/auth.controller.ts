import { HttpContext } from "../../config/app.js";
import { AuthService } from "../services/auth.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import {
  registerValidator, loginValidator, verifyOtpValidator,
  resendOtpValidator, changePasswordValidator,
  resetPasswordValidator, refreshValidator,
} from "../validators/auth.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

export class AuthController {
  private service = new AuthService();

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
    const result  = await this.service.login(payload);
    return ApiResponse.success(c, result, "Connexion réussie.");
  }

  async refresh(c: HttpContext) {
    const payload = await c.validateUsing(refreshValidator);
    const result  = await this.service.refreshTokens(payload.refreshToken);
    return ApiResponse.success(c, result, "Tokens actualisés.");
  }

  async logout(c: HttpContext) {
    const payload = await c.validateUsing(refreshValidator);
    await this.service.logout(payload.refreshToken);
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
    const { email } = await c.req.json();
    await this.service.forgotPassword(email).catch(() => {});
    return ApiResponse.success(c, null, "Si cet email existe, un code vous a été envoyé.");
  }

  async resetPassword(c: HttpContext) {
    const payload = await c.validateUsing(resetPasswordValidator);
    await this.service.resetPassword(payload);
    return ApiResponse.success(c, null, "Mot de passe réinitialisé avec succès.");
  }

  async generateQr(c: HttpContext) {
    const userId = c.get("userId") as string;
    const result = await this.service.generateQrToken(userId);
    return ApiResponse.success(c, result, "Token QR généré.");
  }

  async verifyQr(c: HttpContext) {
    const { token, deviceName, platform, fingerprint } = await c.req.json();
    const result = await this.service.verifyQrToken({ token, deviceName, platform, fingerprint });
    if (result.device?.id) {
      RealtimeBus.emit(WsEventName.DeviceLinked, result.device, { userId: result.user.id });
    }
    return ApiResponse.success(c, result, "Appareil lié avec succès.", 201);
  }
}
