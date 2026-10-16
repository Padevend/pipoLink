import { prisma } from "../../config/database.js";
import { FileService } from "./file.service.js";
import { FileUrl } from "./file-url.service.js";

function formatAnnouncement(announcement: any) {
  return {
    ...announcement,
    poster: announcement.poster ? FileUrl.announcementPoster(announcement.id, "poster") : null,
    previewUrl: announcement.previewUrl ? FileUrl.announcementPoster(announcement.id, "preview") : null,
  };
}

export class AnnouncementService {
  private fileService = new FileService();

  async listAnnouncements() {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } }
    });
    return announcements.map(formatAnnouncement);
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
    
    const announcement = await prisma.announcement.create({
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
    return formatAnnouncement(announcement);
  }

  async deleteAnnouncement(announcementId: string) {
    const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
    await prisma.announcement.delete({
      where: { id: announcementId },
    });
    for (const reference of [announcement?.poster, announcement?.previewUrl]) {
      if (reference) {
        this.fileService.deleteFileByReference(reference).catch((error) => {
          console.warn("[Announcement] Échec de suppression du fichier:", error);
        });
      }
    }
  }
}
