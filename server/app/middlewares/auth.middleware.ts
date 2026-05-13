import { Context, Next } from "hono";
import { hash } from "../../config/hash.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";

/**
 * Middleware d'authentification JWT.
 * Vérifie la présence et la validité du Bearer token dans le header Authorization.
 * Injecte userId, role et plan dans le contexte Hono pour les controllers.
 *
 * @throws UNAUTHORIZED (401) si le token est absent, invalide ou expiré
 */
export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return ApiResponse.error(c, ErrorCode.UNAUTHORIZED, "Token d'authentification requis.", 401);
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = await hash.jwt.decode(token);

    c.set("userId",   payload.payload.sub);
    c.set("role",     payload.payload.role);
    c.set("deviceId", payload.payload.deviceId);
    c.set("isConfigured", payload.payload.is_configured === true);

    await next();
  } catch {
    return ApiResponse.error(c, ErrorCode.UNAUTHORIZED, "Token invalide ou expiré.", 401);
  }
}
