import { prisma }      from "../../config/database.js";
import { FileService } from "./file.service.js";

export class UserService {
  private fileService = new FileService();

  async getMe(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile:      true,
        subscription: true,
        devices:      { where: { revokedAt: null } },
      },
    });
  }

  async completeOnboarding(userId: string, payload: Record<string, any>) {
    await prisma.userProfile.upsert({
      where:  { user_id: userId },
      update: payload,
      create: { user_id: userId, ...(payload as any) },
    });
    await prisma.user.update({ where: { id: userId }, data: { is_configured: true } });
  }

  async updateProfile(userId: string, payload: Record<string, any>) {
    await prisma.userProfile.upsert({
      where:  { user_id: userId },
      update: payload,
      create: { user_id: userId, firstname: "", lastname: "", ...payload },
    });
  }

  async uploadAvatar(userId: string, file: Buffer) {
    const url = await this.fileService.processAvatar(userId, file);
    await prisma.userProfile.upsert({
      where:  { user_id: userId },
      update: { avatarUrl: url },
      create: { user_id: userId, firstname: "", lastname: "", avatarUrl: url },
    });
    return { avatarUrl: url };
  }

  async deleteAccount(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data:  { revokedAt: new Date() },
    });
    await prisma.user.update({ where: { id: userId }, data: { is_excluded: true } });
    await prisma.auditLog.create({ data: { user_id: userId, action: "ACCOUNT_DELETED" } });
  }
}
