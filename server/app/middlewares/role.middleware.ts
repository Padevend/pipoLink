import { Context, Next } from "hono";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { HttpContext } from "../../config/app.js";

/**
 * Middleware de contrôle de rôle.
 * À utiliser après authMiddleware.
 * Autorise uniquement les rôles spécifiés à accéder à la route.
 *
 * @param allowedRoles - Tableau des rôles autorisés (ex: ['admin', 'staff'])
 * @returns            - Middleware Hono
 *
 * @throws FORBIDDEN (403) si le rôle de l'utilisateur n'est pas dans la liste
 *
 * @example
 *   .post("/folders", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(...))
 */
export function roleMiddleware(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const role = c.get("role") as string;

    if (!allowedRoles.includes(role)) {
      return ApiResponse.error(c as HttpContext, ErrorCode.FORBIDDEN, "Vous n'avez pas les droits pour effectuer cette action.", 403);
    }

    await next();
  };
}
