import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AdminController } from "../../app/controllers/admin.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware } from "../../app/middlewares/role.middleware.js";

export const AdminRouter = new Hono();

AdminRouter
  .use(authMiddleware)
  .use(roleMiddleware(["admin"]))
  .get("/stats", callAction(AdminController, "getStats"))
  .get("/events", callAction(AdminController, "getEvents"))
  .get("/users", callAction(AdminController, "getUsers"))
  .post("/users/:id/ban", callAction(AdminController, "banUser"))
  .post("/users/:id/restore", callAction(AdminController, "restoreUser"))
  .get("/documents", callAction(AdminController, "getDocuments"))
  .delete("/documents/:id", callAction(AdminController, "deleteDocument"))
  .get("/subscriptions", callAction(AdminController, "getSubscriptions"))
  .get("/payments", callAction(AdminController, "getPayments"));
