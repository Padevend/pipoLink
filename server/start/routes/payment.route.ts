import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { PaymentController } from "../../app/controllers/payment.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const PaymentRouter = new Hono();

PaymentRouter
  .post("/initiate", authMiddleware, callAction(PaymentController, "initiate"))
  .post("/:id/confirm-simulate", authMiddleware, callAction(PaymentController, "confirmSimulated"))
  .get("/:id/status", authMiddleware, callAction(PaymentController, "getStatus"));
