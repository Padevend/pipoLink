import { Hono } from "hono";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { callAction, } from "../../config/app.js";
import { FilesDeliveryControllers } from "../../app/controllers/filesDelivery.controller.js";

const downloadRouter = new Hono();
/**
 * GET /download/:id
 *
 * Route historique pour les documents. Conservée pour éviter de casser les
 * clients existants, mais désormais protégée par le même ACL que `/files`.
 */
downloadRouter.get("/:id", authMiddleware, callAction(FilesDeliveryControllers, "serveLibraryDocuments"));

export { downloadRouter };
