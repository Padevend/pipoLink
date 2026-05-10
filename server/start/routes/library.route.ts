import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { LibraryController } from "../../app/controllers/library.controller.js";
import { FolderController } from "../../app/controllers/folder.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware } from "../../app/middlewares/role.middleware.js";

export const LibraryRouter = new Hono();

// Dossiers
LibraryRouter
  .get("/folders", authMiddleware, callAction(FolderController, "list"))
  .get("/folders/:id", authMiddleware, callAction(FolderController, "show"))
  .post("/folders", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(FolderController, "create"))
  .delete("/folders/:id", authMiddleware, roleMiddleware(["admin"]), callAction(FolderController, "remove"));

// Documents
LibraryRouter
  .get("/documents", authMiddleware, callAction(LibraryController, "listDocuments"))
  .post("/documents", authMiddleware, callAction(LibraryController, "uploadDocument"))
  .get("/documents/search", authMiddleware, callAction(LibraryController, "searchDocuments"))
  .get("/documents/:id/download", authMiddleware, callAction(LibraryController, "downloadDocument"))
  .put("/documents/:id", authMiddleware, callAction(LibraryController, "updateDocument"))
  .delete("/documents/:id", authMiddleware, callAction(LibraryController, "deleteDocument"))
  .post("/documents/:id/moderate", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(LibraryController, "moderateDocument"));
