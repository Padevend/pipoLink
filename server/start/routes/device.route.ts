import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { DeviceController } from "../../app/controllers/device.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const DeviceRouter = new Hono();

DeviceRouter
  .get("/", authMiddleware, callAction(DeviceController, "list"))
  .delete("/:id", authMiddleware, callAction(DeviceController, "revoke"));
