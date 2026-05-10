import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { UpdatesController } from "../../app/controllers/updates.controller.js";

export const UpdatesRouter = new Hono();

UpdatesRouter.get("/", callAction(UpdatesController, "getMetadata"));
