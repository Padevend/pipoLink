import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AiController } from "../../app/controllers/ai.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const AiRouter = new Hono();

AiRouter
  .post("/chat", authMiddleware, callAction(AiController, "chat"))
  .get("/sessions", authMiddleware, callAction(AiController, "getSessions"))
  .delete("/sessions/:id", authMiddleware, callAction(AiController, "deleteSession"))
  .get("/sessions/:id", authMiddleware, callAction(AiController, "getSession"));
