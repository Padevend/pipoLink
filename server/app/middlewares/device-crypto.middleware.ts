import { Context, Next } from "hono";
import { prisma } from "../../config/database.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";
import type { HttpContext } from "../../config/app.js";

const asHttp = (c: Context) => c as unknown as HttpContext;

/**
 * Exige un JWT avec deviceId pointant vers un appareil actif possédant une clé publique (agent.md §14).
 * Placer après authMiddleware + requireOnboardingMiddleware sur les routes messagerie / devices sensibles.
 */
export async function requireDeviceWithPublicKeyMiddleware(c: Context, next: Next) {
  const userId = c.get("userId") as string | undefined;
  const deviceId = c.get("deviceId") as string | null | undefined;

  if (!userId) {
    return ApiResponse.error(asHttp(c), ErrorCode.UNAUTHORIZED, "Authentification requise.", 401);
  }
  if (!deviceId) {
    return ApiResponse.error(
      asHttp(c),
      ErrorCode.DEVICE_KEY_REQUIRED,
      "Aucun appareil cryptographique associé à cette session. Complétez l’onboarding ou la configuration des clés.",
      403,
    );
  }

  const device = await prisma.device.findFirst({
    where: {
      id:         deviceId,
      user_id:    userId,
      revokedAt:  null,
      public_key: { not: null },
    },
    select: { id: true },
  });

  if (!device) {
    return ApiResponse.error(
      asHttp(c),
      ErrorCode.DEVICE_KEY_REQUIRED,
      "Appareil inconnu, révoqué ou sans clé publique. Reconnectez-vous ou reconfigurez cet appareil.",
      403,
    );
  }

  await next();
}
