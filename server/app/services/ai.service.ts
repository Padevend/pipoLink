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

    const sessionWithDocs = await prisma.aiSession.findUnique({
      where: { id: session.id },
      include: { documents: true }
    });

    const aiResponse = await this._callProvider(message, sessionWithDocs?.documents || []);

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
      include: { messages: { orderBy: { createdAt: "asc" } }, documents: true }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    await prisma.aiSession.deleteMany({ where: { id: sessionId, user_id: userId } });
  }

  async getSessionDocuments(userId: string, sessionId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId },
      include: { documents: true }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };
    return session.documents;
  }

  async addDocumentToSession(userId: string, sessionId: string, documentId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };

    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    if (!doc) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    const updatedSession = await prisma.aiSession.update({
      where: { id: sessionId },
      data: {
        documents: {
          connect: { id: documentId }
        }
      },
      include: { documents: true }
    });
    return updatedSession.documents;
  }

  async removeDocumentFromSession(userId: string, sessionId: string, documentId: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };

    await prisma.aiSession.update({
      where: { id: sessionId },
      data: {
        documents: {
          disconnect: { id: documentId }
        }
      }
    });
  }

  async generateStudyAid(userId: string, sessionId: string, type: string) {
    const session = await prisma.aiSession.findFirst({
      where: { id: sessionId, user_id: userId },
      include: { documents: true }
    });
    if (!session) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Session introuvable." };

    if (session.documents.length === 0) {
      throw {
        code: ErrorCode.VALIDATION_ERROR,
        status: 400,
        message: "Veuillez associer au moins un document à cette session pour générer du contenu.",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const documentTitles = session.documents.map((d) => d.title).join(", ");

    let content = "";
    if (type === "summary") {
      content = `### Résumé global des documents (${documentTitles})\n\nCes documents abordent les points clés suivants :\n1. **Concepts Fondamentaux** : Définition des termes clés et mise en contexte.\n2. **Méthodologies** : Analyse des processus décrits et résolution des problèmes associés.\n3. **Synthèse Pratique** : Retours d'expériences et applications concrètes.\n\n*Source principale : ${session.documents[0].fileName}*`;
    } else if (type === "faq") {
      content = `### FAQ (Questions Fréquentes)\n\n**Q1 : Quel est l'objectif principal de ce cours ?**\n*R1 : L'objectif est de maîtriser les fondations théoriques et pratiques présentées dans ${session.documents[0].title}.*\n\n**Q2 : Quels sont les prérequis pour comprendre ces documents ?**\n*R2 : Une bonne connaissance des chapitres d'introduction et des notions associées.*`;
    } else if (type === "quiz") {
      content = `### Quiz d'Évaluation\n\n**Question 1 : Quelle formule est présentée à la page 3 du document ?**\n- [ ] A) E = mc²\n- [x] B) La transformée de Fourier\n- [ ] C) Le théorème de Pythagore\n\n**Question 2 : Vrai ou Faux : Les données du document supportent la thèse principale ?**\n*Réponse : Vrai. Voir section d'analyse de données.*`;
    } else if (type === "flashcards") {
      content = `### Flashcards de Révision\n\n**Recto** : Définition principale du document\n**Verso** : Voir section glossaire de ${session.documents[0].title}\n\n---\n\n**Recto** : Formule clé ou théorème marquant\n**Verso** : Démontré à la page 10.`;
    } else if (type === "timeline") {
      content = `### Chronologie des Événements / Développements\n\n- **T0** : Introduction des concepts clés dans le document.\n- **T1** : Phase d'expérimentation et d'application.\n- **T2** : Conclusion des travaux décrits.`;
    } else if (type === "comparison") {
      content = `### Comparaison de Documents\n\n- **Document A (${session.documents[0]?.title || "N/A"})** : Met l'accent sur les aspects théoriques et académiques.\n- **Document B (${session.documents[1]?.title || "N/A"})** : Se concentre sur les applications industrielles et les études de cas.`;
    } else {
      content = `Génération pour le type "${type}" non supportée.`;
    }

    const aiMessage = await prisma.aiMessage.create({
      data: {
        session_id: session.id,
        role: "assistant",
        content,
      },
    });

    return { message: aiMessage };
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

  private async _callProvider(message: string, documents: any[]): Promise<string> {
    await new Promise((r) => setTimeout(r, 1500));

    if (!documents || documents.length === 0) {
      return "Hiro : Je n'ai aucune source documentaire associée à cette conversation. Veuillez associer un document de votre bibliothèque pour que je puisse y faire référence.";
    }

    const docNames = documents.map(d => d.title).join(", ");
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes("bonjour") || msgLower.includes("salut")) {
      return `Bonjour ! Je suis Hiro, votre assistant d'étude intelligent. Je suis prêt à analyser les documents de cette session : **${docNames}**. Que souhaitez-vous savoir à leur sujet ?`;
    }

    return `D'après vos documents associés (**${docNames}**), voici les éléments de réponse :\n\nLes concepts principaux abordés indiquent que la méthodologie recommandée repose sur une approche itérative [1]. Plus précisément, le document indique que les gains de performance sont directement liés à l'optimisation des flux locaux [2].\n\n---\n**Citations & Références :**\n* [1] *${documents[0].fileName}*, Chapitre 1, page 4 - "Introduction aux méthodes".\n* [2] *${documents[0].fileName}*, Section 2.3, page 12 - "Performance et optimisation".`;
  }
}
