import { HttpContext } from "../../config/app.js";
import { UserService } from "../services/user.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { onboardingValidator, updateProfileValidator } from "../validators/user.validator.js";

export class UserController {
  private service = new UserService();

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
    await this.service.completeOnboarding(userId, payload);
    return ApiResponse.success(c, null, "Profil complété.");
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
    await this.service.deleteAccount(userId);
    return ApiResponse.success(c, null, "Compte supprimé.");
  }
}
