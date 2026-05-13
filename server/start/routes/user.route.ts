import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { UserController } from "../../app/controllers/user.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { requireOnboardingMiddleware } from "../../app/middlewares/onboarding.middleware.js";
import { requireDeviceWithPublicKeyMiddleware } from "../../app/middlewares/device-crypto.middleware.js";

export const UserRouter = new Hono();

UserRouter
  .get("/me", authMiddleware, callAction(UserController, "me"))
  .put("/me", authMiddleware, requireOnboardingMiddleware, callAction(UserController, "updateProfile"))
  .post("/me/onboarding", authMiddleware, callAction(UserController, "completeOnboarding"))
  .post("/me/avatar", authMiddleware, requireOnboardingMiddleware, callAction(UserController, "uploadAvatar"))
  .delete("/me", authMiddleware, requireOnboardingMiddleware, callAction(UserController, "deleteAccount"))
  .get(
    "/:userId/devices/public-keys",
    authMiddleware,
    requireOnboardingMiddleware,
    requireDeviceWithPublicKeyMiddleware,
    callAction(UserController, "devicePublicKeys"),
  );
