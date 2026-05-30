import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { MessagingController } from "../../app/controllers/messaging.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { requireOnboardingMiddleware } from "../../app/middlewares/onboarding.middleware.js";
import { requireDeviceWithPublicKeyMiddleware } from "../../app/middlewares/device-crypto.middleware.js";

export const MessagingRouter = new Hono();

const msgAuth = [authMiddleware, requireOnboardingMiddleware, requireDeviceWithPublicKeyMiddleware] as const;

MessagingRouter
  .get("/", ...msgAuth, callAction(MessagingController, "listConversations"))
  .post("/", ...msgAuth, callAction(MessagingController, "createChat"))
  .get("/:id/my-encrypted-key", ...msgAuth, callAction(MessagingController, "myEncryptedChatKey"))
  .post("/:id/members", ...msgAuth, callAction(MessagingController, "addMember"))
  .get("/:id/messages", ...msgAuth, callAction(MessagingController, "getMessages"))
  .post("/:id/messages", ...msgAuth, callAction(MessagingController, "sendMessage"))
  .post("/:id/messages/upload", ...msgAuth, callAction(MessagingController, "uploadFile"))
  .post("/:id/messages/upload-attachment", ...msgAuth, callAction(MessagingController, "uploadAttachment"))
  .post("/:id/read", ...msgAuth, callAction(MessagingController, "markAsRead"))
  .post("/:id/leave", ...msgAuth, callAction(MessagingController, "leaveGroup"))
  .delete("/:id", ...msgAuth, callAction(MessagingController, "deleteChat"))
  .delete("/:id/messages/:messageId", ...msgAuth, callAction(MessagingController, "deleteMessage"));
