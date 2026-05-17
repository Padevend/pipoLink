import { prisma } from "../../config/database.js";

/**
 * Résout ou crée la hiérarchie de dossiers : Filière / Niveau / UE.
 */
export class FolderResolverService {
  async resolveFolderId(
    ownerId: string,
    filiere: string,
    niveau: string,
    ue: string,
  ): Promise<string> {
    const filiereFolder = await this.findOrCreate(filiere, null, ownerId);
    const niveauFolder = await this.findOrCreate(niveau, filiereFolder.id, ownerId);
    const ueFolder = await this.findOrCreate(ue, niveauFolder.id, ownerId);
    return ueFolder.id;
  }

  private async findOrCreate(name: string, parentId: string | null, ownerId: string) {
    const existing = await prisma.folder.findFirst({
      where: { name, parent_id: parentId },
    });
    if (existing) return existing;

    return prisma.folder.create({
      data: {
        name,
        parent_id: parentId,
        owner_id:  ownerId,
      },
    });
  }
}
