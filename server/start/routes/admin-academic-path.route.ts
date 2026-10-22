import { Hono } from "hono";
import { callAction } from "../../config/app.js";
import { AdminAcademicPathController } from "../../app/controllers/academic-path.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware } from "../../app/middlewares/role.middleware.js";

export const AdminAcademicPathRouter = new Hono();

AdminAcademicPathRouter
  .use(authMiddleware)
  .use(roleMiddleware(["admin"]))
  .get("/", callAction(AdminAcademicPathController, "list"))
  .post("/filieres", callAction(AdminAcademicPathController, "createFiliere"))
  .patch("/filieres/:id", callAction(AdminAcademicPathController, "updateFiliere"))
  .delete("/filieres/:id", callAction(AdminAcademicPathController, "deleteFiliere"))
  .post("/levels", callAction(AdminAcademicPathController, "createLevel"))
  .patch("/levels/:id", callAction(AdminAcademicPathController, "updateLevel"))
  .delete("/levels/:id", callAction(AdminAcademicPathController, "deleteLevel"))
  .post("/units", callAction(AdminAcademicPathController, "createUnit"))
  .patch("/units/:id", callAction(AdminAcademicPathController, "updateUnit"))
  .delete("/units/:id", callAction(AdminAcademicPathController, "deleteUnit"));
