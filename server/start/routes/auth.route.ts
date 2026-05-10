import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AuthController } from "../../app/controllers/auth.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const AuthRouter = new Hono();

AuthRouter
  .post("/register", callAction(AuthController, "register"))
  .post("/verify-otp", callAction(AuthController, "verifyOtp"))
  .post("/resend-otp", callAction(AuthController, "resendOtp"))
  .post("/login", callAction(AuthController, "login"))
  .post("/refresh", callAction(AuthController, "refresh"))
  .post("/logout", authMiddleware, callAction(AuthController, "logout"))
  .post("/logout-all", authMiddleware, callAction(AuthController, "logoutAll"))
  .post("/change-password", authMiddleware, callAction(AuthController, "changePassword"))
  .post("/forgot-password", callAction(AuthController, "forgotPassword"))
  .post("/reset-password", callAction(AuthController, "resetPassword"))
  .get("/qr/generate", authMiddleware, callAction(AuthController, "generateQr"))
  .post("/qr/verify", callAction(AuthController, "verifyQr"));
