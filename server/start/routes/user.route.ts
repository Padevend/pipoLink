import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { UserController } from "../../app/controllers/user.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const UserRouter = new Hono();

UserRouter
  .get("/me", authMiddleware, callAction(UserController, "me"))
  .put("/me", authMiddleware, callAction(UserController, "updateProfile"))
  .post("/me/onboarding", authMiddleware, callAction(UserController, "completeOnboarding"))
  .post("/me/avatar", authMiddleware, callAction(UserController, "uploadAvatar"))
  .delete("/me", authMiddleware, callAction(UserController, "deleteAccount"));
