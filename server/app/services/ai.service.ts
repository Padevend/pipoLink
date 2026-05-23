import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";

/**
 * Service de gestion du chat IA.
 * Gère les sessions, les quotas par plan, et appelle le provider IA.
 */
export class AiService {

  async chat(userId: string, sessionId: string | null, message: string, plan: string) {
    await this._checkQuota(userId, plan);

    let session = sessionId
      ? await prisma.aiSession.findFirst({ where: { id: sessionId, user_id: userId } })
      : null;

    if (!session) {
      session = await prisma.aiSession.create({
        data: {
          user_id: userId,
          title:   message.substring(0, 50),
        },
      });
    }

    const request = await prisma.aiMessage.create({
      data: { session_id: session.id, role: "user", content: message },
    });

    const aiResponse = await this._callProvider(message);

    const aiMessage = await prisma.aiMessage.create({
      data: { session_id: session.id, role: "assistant", content: aiResponse },
    });

    return { session, message: aiMessage, request };
  }

  async getSessions(userId: string) {
    return await prisma.aiSession.findMany({
      where:   { user_id: userId },
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    await prisma.aiSession.deleteMany({ where: { id: sessionId, user_id: userId } });
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  private async _checkQuota(userId: string, plan: string) {
    if (plan === "PREMIUM") return;

    const startOfDay = DateTime.utc().startOf("day").toJSDate();
    const count = await prisma.aiMessage.count({
      where: {
        role:      "user",
        session:   { user_id: userId },
        createdAt: { gte: startOfDay },
      },
    });

    if (count >= 20) {
      throw { code: ErrorCode.QUOTA_EXCEEDED, status: 402, message: "Limite de 20 messages IA par jour atteinte. Passez en PREMIUM." };
    }
  }

  private async _callProvider(_message: string): Promise<string> {
    //await new Promise((r) => setTimeout(r, 1200));
    return "Cette fonctionnalité sera bientôt disponible. Restez connecté pour les prochaines mises à jour de PipoLink ! 🚀";
  }
}
