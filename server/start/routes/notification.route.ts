import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { NotificationController } from "../../app/controllers/notification.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const NotificationRouter = new Hono();

NotificationRouter
  .get("/", authMiddleware, callAction(NotificationController, "list"))
  .post("/mark-all-read", authMiddleware, callAction(NotificationController, "markAllAsRead"))
  .post("/:id/read", authMiddleware, callAction(NotificationController, "markAsRead"));
