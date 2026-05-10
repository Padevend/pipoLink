import { prisma } from "../../config/database.js";

export class AnnouncementService {
  async listAnnouncements() {
    return await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } }
    });
  }

  async createAnnouncement(authorId: string, payload: { title: string; content: string }) {
    return await prisma.announcement.create({
      data: {
        title: payload.title,
        content: payload.content,
        author_id: authorId
      }
    });
  }
}
