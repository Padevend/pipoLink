import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { LibraryController } from "../../app/controllers/library.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware } from "../../app/middlewares/role.middleware.js";

export const LibraryRouter = new Hono();

LibraryRouter
  .get("/browse", authMiddleware, callAction(LibraryController, "browse"))
  .get("/documents/mine", authMiddleware, callAction(LibraryController, "listMyDocuments"))
  .get("/documents/search", authMiddleware, callAction(LibraryController, "searchDocuments"))
  .get("/documents/:id/download", authMiddleware, callAction(LibraryController, "downloadDocument"))
  .get("/documents/:id", authMiddleware, callAction(LibraryController, "getDocument"))
  .get("/documents", authMiddleware, callAction(LibraryController, "listDocuments"))
  .post("/documents", authMiddleware, callAction(LibraryController, "uploadDocument"))
  .put("/documents/:id", authMiddleware, callAction(LibraryController, "updateDocument"))
  .delete("/documents/:id", authMiddleware, callAction(LibraryController, "deleteDocument"))
  .post("/documents/:id/moderate", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(LibraryController, "moderateDocument"));
