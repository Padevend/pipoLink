import { Context, Next } from "hono";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";
import type { HttpContext } from "../../config/app.js";

const asHttp = (c: Context) => c as unknown as HttpContext;

/**
 * Refuse l'accès si le JWT indique is_configured=false.
 * À placer après authMiddleware. Exempte POST /users/me/onboarding (path relatif /me/onboarding).
 */
export async function requireOnboardingMiddleware(c: Context, next: Next) {
  const path = c.req.path;
  if (c.req.method === "POST" && path === "/me/onboarding") {
    return next();
  }
  if (c.req.method === "GET" && path === "/me") {
    return next();
  }

  const ok = c.get("isConfigured") === true;
  if (!ok) {
    return ApiResponse.error(
      asHttp(c),
      ErrorCode.ONBOARDING_REQUIRED,
      "Complétez votre profil et la configuration des clés pour continuer.",
      403,
    );
  }

  await next();
}
