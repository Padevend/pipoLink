import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AcademicPathController } from "../../app/controllers/academic-path.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const AcademicPathRouter = new Hono();

AcademicPathRouter.get("/", authMiddleware, callAction(AcademicPathController, "list"));
