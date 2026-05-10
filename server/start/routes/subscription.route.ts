import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { SubscriptionController } from "../../app/controllers/subscription.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const SubscriptionRouter = new Hono();

SubscriptionRouter.get("/", authMiddleware, callAction(SubscriptionController, "get"));
