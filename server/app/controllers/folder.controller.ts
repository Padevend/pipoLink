import { HttpContext } from "../../config/app.js";
import { FolderService } from "../services/folder.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import vine from "@vinejs/vine";

const createFolderValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1),
    parentId: vine.string().uuid().optional(),
  })
);

export class FolderController {
  private service = new FolderService();

  async list(c: HttpContext) {
    const parentId = c.req.query("parentId");
    const folders = await this.service.listFolders(parentId);
    return ApiResponse.success(c, folders, "Dossiers récupérés.");
  }

  async show(c: HttpContext) {
    const folder = await this.service.getFolder(c.req.param("id") || "");
    return ApiResponse.success(c, folder, "Dossier récupéré.");
  }

  async create(c: HttpContext) {
    const userId = c.get("userId") as string;
    const payload = await c.validateUsing(createFolderValidator);
    const folder = await this.service.createFolder(userId, payload);
    return ApiResponse.success(c, folder, "Dossier créé.", 201);
  }

  async remove(c: HttpContext) {
    await this.service.deleteFolder(c.req.param("id") || "");
    return ApiResponse.success(c, null, "Dossier supprimé.");
  }
}
