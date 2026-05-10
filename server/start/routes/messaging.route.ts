import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { MessagingController } from "../../app/controllers/messaging.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const MessagingRouter = new Hono();

MessagingRouter
  .get("/", authMiddleware, callAction(MessagingController, "listConversations"))
  .post("/", authMiddleware, callAction(MessagingController, "createConversation"))
  .get("/:id/messages", authMiddleware, callAction(MessagingController, "getMessages"))
  .post("/:id/messages", authMiddleware, callAction(MessagingController, "sendMessage"))
  .post("/:id/messages/upload", authMiddleware, callAction(MessagingController, "uploadFile"))
  .post("/:id/read", authMiddleware, callAction(MessagingController, "markAsRead"));
