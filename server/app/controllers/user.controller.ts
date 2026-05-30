import { HttpContext } from "../../config/app.js";
import { UserService } from "../services/user.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { deleteAccountValidator, onboardingValidator, updateProfileValidator } from "../validators/user.validator.js";
import { AuthService } from "../services/auth.service.js";

export class UserController {
  private service = new UserService();
  private authService = new AuthService();

  async me(c: HttpContext) {
    const userId = c.get("userId") as string;
    const user = await this.service.getMe(userId);
    return ApiResponse.success(c, user, "Profil récupéré.");
  }

  async updateProfile(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(updateProfileValidator);
    await this.service.updateProfile(userId, payload);
    return ApiResponse.success(c, null, "Profil mis à jour.");
  }

  async completeOnboarding(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(onboardingValidator);
    const result = await this.service.completeOnboarding(userId, payload as any);
    return ApiResponse.success(c, result, "Profil et appareil configurés.");
  }

  async search(c: HttpContext) {
    const userId = c.get("userId") as string;
    const q = c.req.query("q") ?? "";
    const users = await this.service.searchUsers(userId, String(q));
    return ApiResponse.success(c, users, "Résultats de recherche.");
  }

  async devicePublicKeys(c: HttpContext) {
    const requesterId = c.get("userId") as string;
    const userIdParam = c.req.param("userId")!;
    const targetUserId = userIdParam === "me" ? requesterId : userIdParam;
    const keys = await this.service.listDevicePublicKeys(targetUserId);
    return ApiResponse.success(c, keys, "Clés publiques.");
  }

  async uploadAvatar(c: HttpContext) {
    const userId = c.get("userId") as string;
    const body = await c.req.parseBody();
    const file = body["file"];
    
    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await this.service.uploadAvatar(userId, buffer);
      return ApiResponse.success(c, result, "Avatar mis à jour.");
    }
    return ApiResponse.error(c, "VALIDATION_ERROR", "Fichier invalide.", 400);
  }

  async deleteAccount(c: HttpContext) {
    const userId = c.get("userId") as string;
    const { email } = await c.validateUsing(deleteAccountValidator);
    
    if (!email) {
      return ApiResponse.error(c, "VALIDATION_ERROR", "Email requis pour la suppression.", 400);
    }

    const user = await this.service.getMe(userId);
    if (!user || user.email !== email) {
      return ApiResponse.error(c, "VALIDATION_ERROR", "L'email ne correspond pas à votre compte.", 400);
    }

    await this.service.deleteAccount(userId);
    return ApiResponse.success(c, null, "Compte supprimé.");
  }
}
