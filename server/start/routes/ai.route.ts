import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AiController } from "../../app/controllers/ai.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { injectPlanMiddleware } from "../../app/middlewares/plan.middleware.js";

export const AiRouter = new Hono();

AiRouter
  .post("/chat", authMiddleware, injectPlanMiddleware, callAction(AiController, "chat"))
  .get("/sessions", authMiddleware, callAction(AiController, "getSessions"))
  .delete("/sessions/:id", authMiddleware, callAction(AiController, "deleteSession"))
  .get("/sessions/:id", authMiddleware, callAction(AiController, "getSession"))
  .get("/sessions/:id/documents", authMiddleware, callAction(AiController, "getDocuments"))
  .post("/sessions/:id/documents", authMiddleware, callAction(AiController, "addDocument"))
  .delete("/sessions/:id/documents/:documentId", authMiddleware, callAction(AiController, "removeDocument"))
  .post("/sessions/:id/generate", authMiddleware, injectPlanMiddleware, callAction(AiController, "generateStudyAid"));
