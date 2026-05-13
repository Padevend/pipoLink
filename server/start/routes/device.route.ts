import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { DeviceController } from "../../app/controllers/device.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { requireOnboardingMiddleware } from "../../app/middlewares/onboarding.middleware.js";
import { requireDeviceWithPublicKeyMiddleware } from "../../app/middlewares/device-crypto.middleware.js";

export const DeviceRouter = new Hono();

const devAuth = [authMiddleware, requireOnboardingMiddleware, requireDeviceWithPublicKeyMiddleware] as const;

DeviceRouter
  .get("/", ...devAuth, callAction(DeviceController, "list"))
  .post("/:id/rotate-keys", ...devAuth, callAction(DeviceController, "rotateKeys"))
  .delete("/:id", ...devAuth, callAction(DeviceController, "revoke"));
