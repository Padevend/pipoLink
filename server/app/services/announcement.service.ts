import { prisma } from "../../config/database.js";
import { FileService } from "./file.service.js";

export class AnnouncementService {
  private fileService = new FileService();

  async listAnnouncements() {
    return await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } }
    });
  }

  async createAnnouncement(authorId: string, payload: { title: string; content: string, poster: File | null |undefined }) {
    // save poster
    let posterUrl: string | null = null
    let previewUrl: string | null = null

    if (payload.poster instanceof File) {
      const buffer = Buffer.from(await payload.poster.arrayBuffer());
      const storedPoster = await this.fileService.saveAnnouncementPoster(buffer, payload.poster.type, 100);
      const storedPreview = await this.fileService.saveAnnouncementPoster(buffer, payload.poster.type, 1);

      posterUrl = storedPoster;
      previewUrl = storedPreview;
    }
    
    return await prisma.announcement.create({
      data: {
        title: payload.title,
        content: payload.content,
        author_id: authorId,
        poster: posterUrl,
        previewUrl: previewUrl,
      },
      include: {
        author: { select: { username: true } },
      },
    });
  }

  async deleteAnnouncement(announcementId: string) {
    await prisma.announcement.delete({
      where: { id: announcementId },
    });
  }
}
