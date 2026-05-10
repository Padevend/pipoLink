import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AnnouncementController } from "../../app/controllers/announcement.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware } from "../../app/middlewares/role.middleware.js";

export const AnnouncementRouter = new Hono();

AnnouncementRouter
  .get("/", authMiddleware, callAction(AnnouncementController, "list"))
  .post("/", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(AnnouncementController, "create"));
