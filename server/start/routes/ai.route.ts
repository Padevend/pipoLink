import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AiController } from "../../app/controllers/ai.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { injectPlanMiddleware, planMiddleware } from "../../app/middlewares/plan.middleware.js";

export const AiRouter = new Hono();

AiRouter
  .get("/tokens", authMiddleware, callAction(AiController, "getTokensStatus"))
  .post("/chat", authMiddleware, injectPlanMiddleware, callAction(AiController, "chat"))
  .get("/sessions", authMiddleware, callAction(AiController, "getSessions"))
  .delete("/sessions/:id", authMiddleware, callAction(AiController, "deleteSession"))
  .get("/sessions/:id", authMiddleware, callAction(AiController, "getSession"))
  .get("/sessions/:id/documents", authMiddleware, callAction(AiController, "getDocuments"))
  .post("/sessions/:id/documents", authMiddleware, callAction(AiController, "addDocument"))
  .delete("/sessions/:id/documents/:documentId", authMiddleware, callAction(AiController, "removeDocument"))
  .post("/sessions/:id/generate", authMiddleware, injectPlanMiddleware, callAction(AiController, "generateStudyAid"))
  .post("/upload-attachment", authMiddleware, callAction(AiController, "uploadAttachment"))
  .post("/upload-attachement", authMiddleware, callAction(AiController, "uploadAttachment"))
  .post("/uplaod-attachement", authMiddleware, callAction(AiController, "uploadAttachment"))
  .get("/attachments", authMiddleware, callAction(AiController, "getAttachments"))
  .delete("/attachments/:id", authMiddleware, callAction(AiController, "deleteAttachment"));
