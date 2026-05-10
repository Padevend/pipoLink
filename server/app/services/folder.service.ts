import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";

export class FolderService {
  async listFolders(parentId?: string) {
    return await prisma.folder.findMany({
      where: { parent_id: parentId ?? null },
      orderBy: { createdAt: "desc" }
    });
  }

  async createFolder(ownerId: string, payload: { name: string; parentId?: string }) {
    return await prisma.folder.create({
      data: {
        name: payload.name,
        owner_id: ownerId,
        parent_id: payload.parentId ?? null
      }
    });
  }

  async getFolder(id: string) {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Dossier introuvable." };
    return folder;
  }

  async deleteFolder(id: string) {
    await prisma.folder.delete({ where: { id } });
  }
}
