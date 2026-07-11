import { Context, Next } from "hono";
import { hash } from "../../config/hash.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { HttpContext } from "../../config/app.js";
import { prisma } from "../../config/database.js";
import { getCookie } from "hono/cookie";

/**
 * Middleware d'authentification JWT.
 * Vérifie la présence et la validité du token (Bearer header ou cookie pipolink_admin_token).
 * Injecte userId, role et plan dans le contexte Hono pour les controllers.
 *
 * @throws UNAUTHORIZED (401) si le token est absent, invalide ou expiré
 */
export async function authMiddleware(c: Context, next: Next) {
  let token = "";
  const authorization = c.req.header("Authorization");

  if (authorization && authorization.startsWith("Bearer ")) {
    token = authorization.replace("Bearer ", "");
  } else {
    token = getCookie(c, "pipolink_admin_token") || "";
  }

  if (!token) {
    return ApiResponse.error(c as HttpContext, ErrorCode.UNAUTHORIZED, "Token d'authentification requis.", 401);
  }

  try {
    const payload = await hash.jwt.decode(token);
    const user = await prisma.user.findUnique({
      where: {
        id: payload.payload.sub,
      },
      select: {
        id: true,
        role: true,
        is_configured: true,
        status: true,
        isAnonymized: true,
      }
    });
    if (!user || user.status === "DELETED" || user.isAnonymized) {
      return ApiResponse.error(c as HttpContext, ErrorCode.UNAUTHORIZED, "Utilisateur non trouvé ou supprimé.", 401);
    }
    
    // Spec §6.4 — Vérification obligatoire du statut Device.revokedAt
    if (payload.payload.deviceId) {
      const device = await prisma.device.findFirst({
        where: { id: payload.payload.deviceId, user_id: user.id },
        select: { revokedAt: true }
      });
      if (!device || device.revokedAt) {
        return ApiResponse.error(c as HttpContext, ErrorCode.UNAUTHORIZED, "Appareil révoqué ou introuvable.", 401);
      }
    }

    c.set("userId",   payload.payload.sub);
    c.set("role",     user.role);
    c.set("deviceId", payload.payload.deviceId);
    c.set("isConfigured", user.is_configured === true);
    c.set("user", user);

    await next();
  } catch {
    return ApiResponse.error(c as HttpContext, ErrorCode.UNAUTHORIZED, "Token invalide ou expiré.", 401);
  }
}
