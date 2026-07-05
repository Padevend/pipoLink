import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { PaymentController } from "../../app/controllers/payment.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const PaymentRouter = new Hono();

PaymentRouter
  .post("/initiate", authMiddleware, callAction(PaymentController, "initiate"))
  .post("/webhook", callAction(PaymentController, "handleWebhook"))
  .get("/:id/status", authMiddleware, callAction(PaymentController, "getStatus"));
