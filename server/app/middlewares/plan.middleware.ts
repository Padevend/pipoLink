import { Context, Next } from "hono";
import { prisma } from "../../config/database.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { HttpContext } from "../../config/app.js";

/**
 * Middleware de contrôle du plan d'abonnement.
 * À utiliser après authMiddleware pour les routes PREMIUM uniquement.
 * Vérifie que l'utilisateur a un abonnement PREMIUM actif.
 *
 * @throws PREMIUM_REQUIRED (402) si le plan n'est pas PREMIUM ou est expiré
 *
 * @example
 *   .get("/ai/advanced", authMiddleware, planMiddleware, callAction(...))
 */
export async function planMiddleware(c: Context, next: Next) {
  const userId = c.get("userId") as string;

  const subscription = await prisma.subscription.findUnique({ where: { user_id: userId } });

  if (!subscription || subscription.plan !== "PREMIUM" || subscription.status !== "ACTIVE") {
    return ApiResponse.error(c as HttpContext, ErrorCode.PREMIUM_REQUIRED, "Cette fonctionnalité nécessite un abonnement PREMIUM.", 402);
  }

  c.set("plan", "PREMIUM");
  await next();
}
