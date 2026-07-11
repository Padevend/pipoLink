import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { prisma } from "../../config/database.js";
import { hash } from "../../config/hash.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { RealtimeBus } from "../../src/modules/websocket/index.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";
import type {
  AccountDeletedPayload,
  UserLeftGroupPayload,
  UserStatusChangedPayload,
} from "../../src/modules/websocket/events/event-types.js";
import { env } from "../../config/envManager.js";
import { FileService } from "./file.service.js";

/**
 * Audit event types — jamais de données sensibles.
 */
const AuditAction = {
  ACCOUNT_DELETION_STARTED: "ACCOUNT_DELETION_STARTED",
  ACCOUNT_ANONYMIZED: "ACCOUNT_ANONYMIZED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  ACCOUNT_DELETION_FAILED: "ACCOUNT_DELETION_FAILED",
} as const;

/**
 * Résultat de la suppression de compte.
 */
interface AccountDeletionResult {
  success: true;
  message: string;
}

/**
 * Données collectées avant la transaction pour les opérations post-commit.
 */
interface PreTransactionData {
  avatarPath: string | null;
  groupMemberships: { conversation_id: string; chatName: string | null; chatType: string }[];
  directConversationUserIds: string[];
  aiAttachmentUrls: string[];
}

/**
 * AccountDeletionService — Service métier complet de suppression de compte.
 *
 * Toute la logique de suppression est encapsulée ici.
 * Les contrôleurs n'ont qu'à appeler `execute(userId, password)`.
 *
 * Contraintes :
 * - Jamais de suppression physique de la ligne User
 * - Jamais de FK cassée
 * - Jamais de perte de messages/conversations
 * - Transaction unique avec rollback complet
 */
export class AccountDeletionService {

  /**
   * Point d'entrée principal — exécute le workflow complet de suppression de compte.
   *
   * @param userId   - ID de l'utilisateur à supprimer
   * @param password - Mot de passe pour vérification d'identité
   * @returns        - Résultat de succès si la transaction a commit
   * @throws         - 401 mot de passe incorrect, 409 déjà supprimé, 500 erreur interne
   */
  async execute(userId: string, password: string): Promise<AccountDeletionResult> {
    // ── 1. Vérification d'identité ──────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Utilisateur introuvable." };
    }

    // Vérifier que le compte n'est pas déjà supprimé
    if (user.status === "DELETED" || user.isAnonymized) {
      throw {
        code: ErrorCode.ACCOUNT_ALREADY_DELETED,
        status: 409,
        message: "Ce compte a déjà été supprimé.",
      };
    }

    // Vérifier le mot de passe
    const passwordValid = await hash.compare(password, user.password);
    if (!passwordValid) {
      throw {
        code: ErrorCode.INVALID_CREDENTIALS,
        status: 401,
        message: "Mot de passe incorrect.",
      };
    }

    // ── 2. Collecte des données pré-transaction ─────────────────────────────
    // On collecte ce dont on a besoin pour les émissions WebSocket post-commit
    const preData = await this._collectPreTransactionData(userId, user.profile?.avatarUrl ?? null);

    // ── 3. Transaction unique ───────────────────────────────────────────────
    const anonymizationUuid = crypto.randomUUID();

    try {
      await prisma.$transaction(async (trx) => {
        // Log de démarrage
        await trx.auditLog.create({
          data: { user_id: userId, action: AuditAction.ACCOUNT_DELETION_STARTED },
        });

        // ── 3a. Révocation des accès ────────────────────────────────────────
        await this._revokeAllAccess(trx, userId);

        // ── 3b. Destruction des données E2EE ────────────────────────────────
        await this._destroyE2EEData(trx, userId);

        // ── 3c. Sortie des groupes + messages système ───────────────────────
        await this._leaveAllGroups(trx, userId, preData.groupMemberships);

        // ── 3d. Nettoyage des données annexes ───────────────────────────────
        await this._cleanupAuxiliaryData(trx, userId);

        // ── 3e. Anonymisation du compte ─────────────────────────────────────
        await this._anonymizeAccount(trx, userId, anonymizationUuid);

        // Log d'anonymisation
        await trx.auditLog.create({
          data: { user_id: userId, action: AuditAction.ACCOUNT_ANONYMIZED },
        });

        // Log de suppression
        await trx.auditLog.create({
          data: { user_id: userId, action: AuditAction.ACCOUNT_DELETED },
        });
      });
    } catch (error: unknown) {
      // En cas d'échec, la transaction est rollback automatiquement.
      // On log l'échec (sans données sensibles).
      console.error(
        `[AccountDeletion] Échec pour userId=${userId}:`,
        error instanceof Error ? error.message : "Erreur inconnue",
      );

      // Tenter de créer un audit log d'échec (hors transaction)
      try {
        await prisma.auditLog.create({
          data: {
            user_id: userId,
            action: AuditAction.ACCOUNT_DELETION_FAILED,
            targetId: error instanceof Error ? error.message.slice(0, 200) : "unknown",
          },
        });
      } catch {
        // Ignorer — si la base est indisponible, on ne peut rien faire
      }

      throw {
        code: ErrorCode.INTERNAL_ERROR,
        status: 500,
        message: "Échec de la suppression du compte. Aucune donnée n'a été modifiée.",
      };
    }

    // ── 4. Opérations post-commit (best-effort) ────────────────────────────
    this._postCommitCleanup(userId, preData);

    return {
      success: true,
      message: "Compte supprimé avec succès.",
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Méthodes privées — chaque étape du workflow
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Collecte les données nécessaires aux opérations post-commit
   * (WebSocket, suppression de fichiers) AVANT la transaction.
   */
  private async _collectPreTransactionData(
    userId: string,
    avatarUrl: string | null,
  ): Promise<PreTransactionData> {
    // Memberships de groupe (pour messages système + WebSocket)
    const memberships = await prisma.conversationMember.findMany({
      where: { user_id: userId },
      include: {
        conversation: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    const groupMemberships = memberships
      .filter((m) => m.conversation.type === "group")
      .map((m) => ({
        conversation_id: m.conversation.id,
        chatName: m.conversation.name,
        chatType: m.conversation.type,
      }));

    // Conversations directes (pour notifier les contacts)
    const directConversations = memberships.filter((m) => m.conversation.type === "private");
    const directConversationIds = directConversations.map((m) => m.conversation_id);

    const directMembers = directConversationIds.length > 0
      ? await prisma.conversationMember.findMany({
          where: {
            conversation_id: { in: directConversationIds },
            user_id: { not: userId },
          },
          select: { user_id: true },
        })
      : [];

    const directConversationUserIds = [...new Set(directMembers.map((m) => m.user_id))];

    // Chemin de l'avatar pour suppression
    let avatarPath: string | null = null;
    if (avatarUrl && avatarUrl.startsWith("/storage/")) {
      try {
        const storagePath = env.get("STORAGE_PATH");
        avatarPath = path.join(storagePath, avatarUrl.replace("/storage/", ""));
      } catch {
        avatarPath = null;
      }
    }

    const aiDocs = await prisma.document.findMany({
      where: { uploaded_by_id: userId, type: "AI_ATTACHMENT" },
      select: { fileUrl: true }
    });
    const aiAttachmentUrls = aiDocs.map(d => d.fileUrl);

    return { avatarPath, groupMemberships, directConversationUserIds, aiAttachmentUrls };
  }

  /**
   * Étape 2 — Révocation de tous les accès.
   * Révoque les refresh tokens, supprime les push tokens, révoque les sessions.
   */
  private async _revokeAllAccess(trx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], userId: string): Promise<void> {
    const now = new Date();

    // Révoquer tous les refresh tokens
    await trx.refreshToken.updateMany({
      where: { user_id: userId, revokedAt: null },
      data: { revokedAt: now },
    });

    // Supprimer les FCM tokens de tous les appareils (push tokens)
    await trx.device.updateMany({
      where: { user_id: userId },
      data: { fcm_token: null },
    });
  }

  /**
   * Étape 3 — Destruction des données E2EE.
   * Supprime les clés de chat, vide les clés publiques des devices, puis révoque les devices.
   */
  private async _destroyE2EEData(trx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], userId: string): Promise<void> {
    const now = new Date();

    // Récupérer tous les device IDs de l'utilisateur
    const devices = await trx.device.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    const deviceIds = devices.map((d) => d.id);

    if (deviceIds.length > 0) {
      // Supprimer toutes les ChatMemberKey associées aux devices
      await trx.chatMemberKey.deleteMany({
        where: { device_id: { in: deviceIds } },
      });
    }

    // Révoquer et nettoyer les clés de tous les appareils
    // (on ne supprime PAS les devices pour préserver les FK de RefreshToken)
    await trx.device.updateMany({
      where: { user_id: userId },
      data: {
        revokedAt: now,
        public_key: null,
        key_signature: null,
        keyCreatedAt: null,
        keyExpiresAt: null,
        fcm_token: null,
      },
    });

    // Supprimer les QR tokens (données transitoires liées aux clés)
    await trx.qrToken.deleteMany({
      where: { user_id: userId },
    });
  }

  /**
   * Étape 4 — Sortie de tous les groupes.
   * Retire l'utilisateur, crée un message système par groupe.
   */
  private async _leaveAllGroups(
    trx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    groupMemberships: PreTransactionData["groupMemberships"],
  ): Promise<void> {
    // Créer un message système dans chaque groupe
    for (const membership of groupMemberships) {
      await trx.message.create({
        data: {
          id: crypto.randomUUID(),
          chat_id: membership.conversation_id,
          sender_id: userId,
          cipherText: "Cet utilisateur a quitté PipoLink.",
          iv: "system",
          type: "SYSTEM",
          status: "send",
        },
      });
    }

    // Supprimer tous les memberships (groupes ET conversations privées)
    // Le sender_id des messages reste valide car la ligne User anonymisée persiste
    await trx.conversationMember.deleteMany({
      where: { user_id: userId },
    });

    // Révoquer les invitations de groupe créées par l'utilisateur
    await trx.groupInvitation.updateMany({
      where: { created_by_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  /**
   * Étape 5 — Nettoyage des données annexes.
   * Supprime notifications, OTP, sessions IA. Conserve documents et payments.
   */
  private async _cleanupAuxiliaryData(trx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], userId: string): Promise<void> {
    // Supprimer les notifications
    await trx.notification.deleteMany({
      where: { user_id: userId },
    });

    // Supprimer les OTP
    await trx.otp.deleteMany({
      where: { user_id: userId },
    });

    // Supprimer les sessions IA (cascade → supprime aussi les AiMessage)
    await trx.aiSession.deleteMany({
      where: { user_id: userId },
    });

    // Supprimer les documents personnels IA
    await trx.document.deleteMany({
      where: { uploaded_by_id: userId, type: "AI_ATTACHMENT" },
    });
  }

  /**
   * Étape 6 — Anonymisation du compte.
   * Remplace toutes les données identifiantes par des valeurs génériques.
   * Libère l'email et le username originaux pour réutilisation.
   */
  private async _anonymizeAccount(
    trx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    anonymizationUuid: string,
  ): Promise<void> {
    const now = new Date();

    // Anonymiser la ligne User
    await trx.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${anonymizationUuid}@deleted.local`,
        username: `deleted_${anonymizationUuid}`,
        password: await hash.make(crypto.randomUUID()), // Hash d'un UUID aléatoire → mot de passe inutilisable
        matricule: null,
        status: "DELETED",
        isAnonymized: true,
        is_active: false,
        is_excluded: true,
        deletedAt: now,
        anonymizedAt: now,
      },
    });

    // Anonymiser le profil
    await trx.userProfile.updateMany({
      where: { user_id: userId },
      data: {
        firstname: "Compte",
        lastname: "Supprimé",
        phone: null,
        gender: null,
        bio: null,
        avatarUrl: null,
        niveau: null,
        filiere: null,
      },
    });
  }

  /**
   * Opérations post-commit (best-effort).
   * Si elles échouent, le compte est quand même supprimé.
   */
  private _postCommitCleanup(userId: string, preData: PreTransactionData): void {
    // Émettre ACCOUNT_DELETED vers les clients de l'utilisateur (force déconnexion)
    try {
      const accountDeletedPayload: AccountDeletedPayload = {
        userId,
        message: "Votre compte a été supprimé.",
      };
      RealtimeBus.emit(WsEventName.AccountDeleted, accountDeletedPayload, { userId });
    } catch {
      console.warn("[AccountDeletion] Échec émission ACCOUNT_DELETED");
    }

    // Émettre USER_LEFT_GROUP pour chaque groupe
    for (const membership of preData.groupMemberships) {
      try {
        const payload: UserLeftGroupPayload = {
          groupId: membership.conversation_id,
          userId,
          systemMessage: "Cet utilisateur a quitté PipoLink.",
        };
        RealtimeBus.emit(WsEventName.UserLeftGroup, payload, {
          conversationId: membership.conversation_id,
        });
      } catch {
        console.warn(`[AccountDeletion] Échec émission USER_LEFT_GROUP pour ${membership.conversation_id}`);
      }
    }

    // Émettre USER_STATUS_CHANGED vers les contacts directs
    for (const contactUserId of preData.directConversationUserIds) {
      try {
        const payload: UserStatusChangedPayload = {
          userId,
          status: "DELETED",
        };
        RealtimeBus.emit(WsEventName.UserStatusChanged, payload, { userId: contactUserId });
      } catch {
        console.warn(`[AccountDeletion] Échec émission USER_STATUS_CHANGED pour ${contactUserId}`);
      }
    }

    // Supprimer l'avatar du système de fichiers (si fichier personnel)
    if (preData.avatarPath) {
      try {
        if (fs.existsSync(preData.avatarPath)) {
          fs.unlinkSync(preData.avatarPath);
        }
      } catch {
        console.warn(`[AccountDeletion] Échec suppression avatar : ${preData.avatarPath}`);
      }
    }

    // Delete AI attachment physical files
    if (preData.aiAttachmentUrls.length > 0) {
      const fileService = new FileService();
      for (const url of preData.aiAttachmentUrls) {
        fileService.deleteFileByUrl(url).catch(() => {
          console.warn(`[AccountDeletion] Échec suppression AI_ATTACHMENT : ${url}`);
        });
      }
    }
  }
}
