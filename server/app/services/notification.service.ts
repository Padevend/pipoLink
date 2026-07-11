import { prisma } from "../../config/database.js";

export class NotificationService {
  async createNotification(userId: string, payload: { title: string; body: string; type: string; data?: any }) {
    const notif = await prisma.notification.create({
      data: {
        user_id: userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data ?? undefined,
      },
    });

    return notif;
  }

  async listNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { user_id: userId, isRead: false },
      data: { isRead: true }
    });
  }
}
