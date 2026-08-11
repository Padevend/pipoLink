import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { LibraryController } from "../../app/controllers/library.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware } from "../../app/middlewares/role.middleware.js";
import { planMiddleware } from "../../app/middlewares/plan.middleware.js";

export const LibraryRouter = new Hono();

LibraryRouter
  .get("/popular", authMiddleware, callAction(LibraryController, "getPopularDocuments"))
  .get("/recommended", authMiddleware, callAction(LibraryController, "getRecommandedDocuments"))
  .get("/browse", authMiddleware, callAction(LibraryController, "browse"))
  .get("/documents/mine", authMiddleware, callAction(LibraryController, "listMyDocuments"))
  .get("/documents/search", authMiddleware, callAction(LibraryController, "searchDocuments"))
  .post("/documents/semantic-search", authMiddleware, planMiddleware, callAction(LibraryController, "semanticSearch"))
  .get("/documents/:id/download", authMiddleware, callAction(LibraryController, "downloadDocument"))
  .get("/documents/:id", authMiddleware, callAction(LibraryController, "getDocument"))
  .get("/documents", authMiddleware, callAction(LibraryController, "listDocuments"))
  .post("/documents", authMiddleware, callAction(LibraryController, "uploadDocument"))
  .delete("/documents/:id", authMiddleware, callAction(LibraryController, "deleteDocument"))
  .post("/documents/:id/moderate", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(LibraryController, "moderateDocument"));
