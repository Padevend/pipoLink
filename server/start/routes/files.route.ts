import { Hono } from "hono";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { callAction, } from "../../config/app.js";
import { FilesDeliveryControllers } from "../../app/controllers/filesDelivery.controller.js";

const filesRouter = new Hono();

filesRouter.use("*", authMiddleware);

filesRouter.get("/avatars/:userId", callAction(FilesDeliveryControllers, "serveAvatars"));
filesRouter.get("/message-attachments/:id", callAction(FilesDeliveryControllers, "serveMessageAttachements"));
filesRouter.get("/documents/:id", callAction(FilesDeliveryControllers, "serveDocuments"));
filesRouter.get("/ai-attachments/:id", callAction(FilesDeliveryControllers, "serveAiAttachements"));
filesRouter.get("/announcements/:id/:variant", callAction(FilesDeliveryControllers, "serveAnnouncements"));

export { filesRouter };
