import crypto from "node:crypto";
import { HttpContext } from "../../config/app.js";
import { prisma } from "../../config/database.js";
import { documentIngestionQueue } from "../services/document-ingestion-queue.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { NotificationService } from "../services/notification.service.js";
import { FCMService } from "../../src/app/services/fcm.service.js";
import { MailerService } from "../services/mailer.service.js";
import { createUpdateValidator } from "../validators/update.validator.js";
import { adminNotificationValidator } from "../validators/admin-notification.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

export class AdminController {
  private notifications = new NotificationService();
  private fcm = new FCMService();
  private mailer = new MailerService();

  /**
   * Envoie de notiifcation email pour une action
   */
  private _sendNotifications(to: string, action: string, message: string){
    this.mailer.sendAction(to, action, message);
  }

  /**
   * Obtient les statistiques générales pour le dashboard.
   */
  async getStats(c: HttpContext) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        totalAccounts,
        activeAccounts,
        totalDocuments,
        totalAnnouncements,
        recentEvents,
        totalRevenueAgg,
        monthRevenueAgg,
        activePremium
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { is_active: true, is_excluded: false } }),
        prisma.document.count(),
        prisma.announcement.count(),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: {
                  select: {
                    firstname: true,
                    lastname: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "SUCCESS" },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "SUCCESS", paidAt: { gte: startOfMonth } },
        }),
        prisma.subscription.count({
          where: { plan: "PREMIUM", status: "ACTIVE", currentPeriodEnd: { gt: new Date() } },
        })
      ]);

      const formattedEvents = recentEvents.map(event => {
        const profile = event.user?.profile;
        const displayName = profile?.firstname && profile?.lastname 
          ? `${profile.firstname} ${profile.lastname}`
          : event.user?.username || event.user?.email || "Inconnu";

        return {
          id: event.id,
          userId: event.user_id,
          userEmail: event.user?.email || "Inconnu",
          username: event.user?.username || "Inconnu",
          displayName,
          avatarUrl: profile?.avatarUrl || null,
          action: event.action,
          targetId: event.targetId,
          ip: event.ip || "Inconnu",
          userAgent: event.userAgent || "Inconnu",
          location: event.location || "Inconnu",
          createdAt: event.createdAt
        };
      });

      return ApiResponse.success(c, {
        stats: {
          totalAccounts,
          activeAccounts,
          totalDocuments,
          totalAnnouncements,
          revenue: {
            totalRevenue: totalRevenueAgg._sum.amount ?? 0,
            revenueThisMonth: monthRevenueAgg._sum.amount ?? 0,
            activePremium,
            mrr: activePremium * 2500,
          }
        },
        events: formattedEvents
      }, "Statistiques chargées avec succès.");
    } catch (error: any) {
      console.error("[AdminController.getStats] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du chargement des statistiques.", 500);
    }
  }

  /**
   * Obtient tous les logs d'activité (événements) avec pagination.
   */
  async getEvents(c: HttpContext) {
    try {
      const page = Math.max(1, Number(c.req.query("page") || 1));
      const limit = Math.max(1, Math.min(100, Number(c.req.query("limit") || 20)));
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: {
                  select: {
                    firstname: true,
                    lastname: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }),
        prisma.auditLog.count()
      ]);

      const formattedEvents = events.map(event => {
        const profile = event.user?.profile;
        const displayName = profile?.firstname && profile?.lastname 
          ? `${profile.firstname} ${profile.lastname}`
          : event.user?.username || event.user?.email || "Inconnu";

        return {
          id: event.id,
          userId: event.user_id,
          userEmail: event.user?.email || "Inconnu",
          username: event.user?.username || "Inconnu",
          displayName,
          avatarUrl: profile?.avatarUrl || null,
          action: event.action,
          targetId: event.targetId,
          ip: event.ip || "Inconnu",
          userAgent: event.userAgent || "Inconnu",
          location: event.location || "Inconnu",
          createdAt: event.createdAt
        };
      });

      return ApiResponse.success(c, {
        events: formattedEvents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, "Événements chargés.");
    } catch (error: any) {
      console.error("[AdminController.getEvents] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du chargement des événements.", 500);
    }
  }

  /**
   * Liste les comptes d'utilisateurs avec recherche (nom, email, id, matricule) et pagination.
   */
  async getUsers(c: HttpContext) {
    try {
      const page = Math.max(1, Number(c.req.query("page") || 1));
      const limit = Math.max(1, Math.min(100, Number(c.req.query("limit") || 10)));
      const search = c.req.query("search") || "";
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
          { matricule: { contains: search, mode: "insensitive" } },
          {
            profile: {
              OR: [
                { firstname: { contains: search, mode: "insensitive" } },
                { lastname: { contains: search, mode: "insensitive" } }
              ]
            }
          }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            profile: true,
            subscription: true
          },
          orderBy: { createdAt: "desc" }
        }),
        prisma.user.count({ where })
      ]);

      const formattedUsers = users.map(user => {
        const displayName = user.profile?.firstname && user.profile?.lastname
          ? `${user.profile.firstname} ${user.profile.lastname}`
          : user.username || user.email || "Utilisateur";

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          matricule: user.matricule,
          role: user.role,
          isActive: user.is_active,
          isExcluded: user.is_excluded,
          status: user.status,
          createdAt: user.createdAt,
          displayName,
          profile: user.profile,
          subscription: user.subscription
        };
      });

      return ApiResponse.success(c, {
        users: formattedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, "Utilisateurs récupérés avec succès.");
    } catch (error: any) {
      console.error("[AdminController.getUsers] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du chargement des utilisateurs.", 500);
    }
  }

  /**
   * Bannit (exclut) un compte utilisateur.
   */
  async banUser(c: HttpContext) {
    try {
      const userId = c.req.param("id") as string;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { devices: { where: { revokedAt: null } } }
      });

      if (!user) {
        return ApiResponse.error(c, "NOT_FOUND", "Utilisateur non trouvé.", 404);
      }

      if (user.role === "admin") {
        return ApiResponse.error(c, "FORBIDDEN", "Impossible d'exclure un administrateur.", 403);
      }

      // Mettre à jour l'utilisateur en banni
      await prisma.user.update({
        where: { id: userId },
        data: {
          is_excluded: true,
          status: "BANNED"
        }
      });

      // Révoquer les refresh tokens pour le déconnecter immédiatement
      await prisma.refreshToken.updateMany({
        where: { user_id: userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      // Envoi de notification dans l'application
      const title = "Compte Suspendu";
      const body = "Votre compte a été suspendu par un administrateur pour non-respect des conditions d'utilisation.";
      
      await this.notifications.createNotification(userId, {
        title,
        body,
        type: "ACCOUNT_MUTATION",
        data: { status: "BANNED" }
      });

      this._sendNotifications(user.email!, title, body);

      // Envoi de notification push si possible
      const tokens = user.devices.map(d => d.fcm_token!).filter(Boolean);
      if (tokens.length > 0) {
        await this.fcm.sendPushNotification(tokens, title, body, { status: "BANNED" });
      }

      // Log d'audit admin
      const adminId = c.get("userId") as string;
      await prisma.auditLog.create({
        data: {
          user_id: adminId,
          action: `BAN_USER`,
          targetId: userId,
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent") || "Admin Action"
        }
      });

      return ApiResponse.success(c, null, "L'utilisateur a été suspendu avec succès.");
    } catch (error: any) {
      console.error("[AdminController.banUser] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du bannissement de l'utilisateur.", 500);
    }
  }

  /**
   * Rétablit un compte utilisateur suspendu.
   */
  async restoreUser(c: HttpContext) {
    try {
      const userId = c.req.param("id") as string;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { devices: { where: { revokedAt: null } } }
      });

      if (!user) {
        return ApiResponse.error(c, "NOT_FOUND", "Utilisateur non trouvé.", 404);
      }

      // Mettre à jour l'utilisateur en actif
      await prisma.user.update({
        where: { id: userId },
        data: {
          is_excluded: false,
          status: "ACTIVE"
        }
      });

      // Envoi de notification dans l'application
      const title = "Compte Rétabli";
      const body = "Votre compte a été rétabli par un administrateur. Vous pouvez à présent vous reconnecter.";
      
      await this.notifications.createNotification(userId, {
        title,
        body,
        type: "ACCOUNT_MUTATION",
        data: { status: "ACTIVE" }
      });

      this._sendNotifications(user.email!, title, body);

      // Envoi de notification push si possible
      const tokens = user.devices.map(d => d.fcm_token!).filter(Boolean);
      if (tokens.length > 0) {
        await this.fcm.sendPushNotification(tokens, title, body, { status: "ACTIVE" });
      }

      // Log d'audit admin
      const adminId = c.get("userId") as string;
      await prisma.auditLog.create({
        data: {
          user_id: adminId,
          action: `RESTORE_USER`,
          targetId: userId,
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent") || "Admin Action"
        }
      });

      return ApiResponse.success(c, null, "L'utilisateur a été rétabli avec succès.");
    } catch (error: any) {
      console.error("[AdminController.restoreUser] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du rétablissement de l'utilisateur.", 500);
    }
  }

  /**
   * Liste les documents avec pagination.
   */
  async getDocuments(c: HttpContext) {
    try {
      const page = Math.max(1, Number(c.req.query("page") || 1));
      const limit = Math.max(1, Math.min(100, Number(c.req.query("limit") || 10)));
      const search = c.req.query("search") || "";
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { fileName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { ue: { contains: search, mode: "insensitive" } },
          { filiere: { contains: search, mode: "insensitive" } }
        ];
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          skip,
          take: limit,
          include: {
            uploadedBy: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: {
                  select: {
                    firstname: true,
                    lastname: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }),
        prisma.document.count({ where })
      ]);

      const formattedDocs = documents.map(doc => {
        const profile = doc.uploadedBy?.profile;
        const displayName = profile?.firstname && profile?.lastname
          ? `${profile.firstname} ${profile.lastname}`
          : doc.uploadedBy?.username || doc.uploadedBy?.email || "Inconnu";

        return {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          fileUrl: doc.fileUrl,
          mimeType: doc.mimeType,
          downloadCount: doc.downloadCount,
          moderationStatus: doc.moderationStatus,
          isIngested: doc.isIngested,
          ingestionStatus: doc.ingestionStatus,
          ingestionError: doc.ingestionError,
          createdAt: doc.createdAt,
          uploadedBy: {
            id: doc.uploaded_by_id,
            email: doc.uploadedBy?.email,
            displayName
          }
        };
      });

      return ApiResponse.success(c, {
        documents: formattedDocs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, "Documents récupérés avec succès.");
    } catch (error: any) {
      console.error("[AdminController.getDocuments] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du chargement des documents.", 500);
    }
  }

  /**
   * Supprime un document.
   */
  async enqueueDocumentIngestion(c: HttpContext) {
    try {
      const queued = await documentIngestionQueue.enqueueOutstanding();
      const adminId = c.get("userId") as string;
      await prisma.auditLog.create({ data: { user_id: adminId, action: "DOCUMENT_INGESTION_QUEUED", targetId: null } });
      return ApiResponse.success(c, { queued }, `${queued} document(s) ajouté(s) à la file d’ingestion.`);
    } catch (error) {
      console.error("[AdminController.enqueueDocumentIngestion] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Impossible de lancer l’ingestion.", 500);
    }
  }


  async deleteDocument(c: HttpContext) {
    try {
      const documentId = c.req.param("id") as string;
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          uploadedBy: {
            include: {
              devices: { where: { revokedAt: null } }
            }
          }
        }
      });

      if (!doc) {
        return ApiResponse.error(c, "NOT_FOUND", "Document introuvable.", 404);
      }

      // Supprimer le document (Prisma gère la suppression en cascade ou onDelete: Cascade sur les relations associées)
      await prisma.document.delete({
        where: { id: documentId }
      });

      // Notification à l'auteur du document
      const title = "Document Supprimé";
      const body = `Votre document intitulé "${doc.title}" a été supprimé par un administrateur pour non-respect des règles de la bibliothèque.`;

      await this.notifications.createNotification(doc.uploaded_by_id, {
        title,
        body,
        type: "DOCUMENT_MODERATION",
        data: { documentId, status: "DELETED", title: doc.title }
      });

      this._sendNotifications(doc.uploadedBy.email!, title, body);

      // Notification push FCM si possible
      const tokens = doc.uploadedBy.devices.map(d => d.fcm_token!).filter(Boolean);
      if (tokens.length > 0) {
        await this.fcm.sendPushNotification(tokens, title, body, { documentId, status: "DELETED" });
      }

      // Log d'audit admin
      const adminId = c.get("userId") as string;
      await prisma.auditLog.create({
        data: {
          user_id: adminId,
          action: "DELETE_DOCUMENT",
          targetId: documentId,
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent") || "Admin Action"
        }
      });

      return ApiResponse.success(c, null, "Le document a été supprimé et l'auteur notifié.");
    } catch (error: any) {
      console.error("[AdminController.deleteDocument] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors de la suppression du document.", 500);
    }
  }

  /**
   * Liste les abonnements (subscriptions) actifs et expirés.
   */
  async getSubscriptions(c: HttpContext) {
    try {
      const page = Math.max(1, Number(c.req.query("page") || 1));
      const limit = Math.max(1, Math.min(100, Number(c.req.query("limit") || 10)));
      const skip = (page - 1) * limit;

      const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: {
                  select: {
                    firstname: true,
                    lastname: true
                  }
                }
              }
            }
          },
          orderBy: { updatedAt: "desc" }
        }),
        prisma.subscription.count()
      ]);

      const formattedSubs = subscriptions.map(sub => {
        const profile = sub.user?.profile;
        const displayName = profile?.firstname && profile?.lastname
          ? `${profile.firstname} ${profile.lastname}`
          : sub.user?.username || sub.user?.email || "Inconnu";

        // Déterminer le statut réel en fonction de la date de fin
        const isExpired = sub.currentPeriodEnd ? new Date() > new Date(sub.currentPeriodEnd) : false;
        const status = isExpired ? "expired" : sub.status;

        return {
          id: sub.id,
          userId: sub.user_id,
          userDisplayName: displayName,
          userEmail: sub.user?.email || "Inconnu",
          plan: sub.plan,
          status,
          currentPeriodEnd: sub.currentPeriodEnd,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt
        };
      });

      return ApiResponse.success(c, {
        subscriptions: formattedSubs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, "Abonnements récupérés avec succès.");
    } catch (error: any) {
      console.error("[AdminController.getSubscriptions] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du chargement des abonnements.", 500);
    }
  }

  /**
   * Liste les paiements.
   */
  async getPayments(c: HttpContext) {
    try {
      const page = Math.max(1, Number(c.req.query("page") || 1));
      const limit = Math.max(1, Math.min(100, Number(c.req.query("limit") || 10)));
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: {
                  select: {
                    firstname: true,
                    lastname: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }),
        prisma.payment.count()
      ]);

      const formattedPayments = payments.map(payment => {
        const profile = payment.user?.profile;
        const displayName = profile?.firstname && profile?.lastname
          ? `${profile.firstname} ${profile.lastname}`
          : payment.user?.username || payment.user?.email || "Inconnu";

        return {
          id: payment.id,
          userId: payment.user_id,
          userDisplayName: displayName,
          userEmail: payment.user?.email || "Inconnu",
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          provider: payment.provider,
          providerRef: payment.providerRef,
          paidAt: payment.paidAt,
          expiresAt: payment.expiresAt,
          createdAt: payment.createdAt
        };
      });

      return ApiResponse.success(c, {
        payments: formattedPayments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, "Paiements récupérés avec succès.");
    } catch (error: any) {
      console.error("[AdminController.getPayments] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du chargement des paiements.", 500);
    }
  }

  /**
   * Obtient toutes les versions de mise à jour enregistrées.
   */
  async getUpdates(c: HttpContext) {
    try {
      const updates = await prisma.updateVersioning.findMany({
        orderBy: { createdAt: "desc" },
      });
      return ApiResponse.success(c, updates, "Liste des mises à jour récupérée.");
    } catch (error: any) {
      console.error("[AdminController.getUpdates] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors du chargement des mises à jour.", 500);
    }
  }

  /**
   * Envoie une notification (in-app + push) à tous les utilisateurs actifs.
   */
  async sendBroadcastNotification(c: HttpContext) {
    try {
      const payload = await c.validateUsing(adminNotificationValidator);

      const recipients = await prisma.user.findMany({
        where: { is_active: true },
        select: { id: true },
      });

      if (recipients.length > 0) {
        await prisma.notification.createMany({
          data: recipients.map((u) => ({
            user_id: u.id,
            title: payload.title,
            body: payload.body,
            type: "ADMIN_BROADCAST",
          })),
        });

        for (const u of recipients) {
          RealtimeBus.emit(
            WsEventName.NotificationCreated,
            { title: payload.title, body: payload.body, type: "ADMIN_BROADCAST" },
            { userId: u.id },
          );
        }

        const devices = await prisma.device.findMany({
          where: { fcm_token: { not: null }, user: { is_active: true } },
          select: { fcm_token: true },
        });
        const tokens = devices.map((d) => d.fcm_token as string);
        if (tokens.length > 0) {
          void this.fcm.sendDataPush(tokens, {
            type: "ADMIN_BROADCAST",
            notificationId: crypto.randomUUID(),
            title: payload.title,
            body: payload.body,
          });
        }
      }

      const adminId = c.get("userId") as string;
      await prisma.auditLog.create({
        data: {
          user_id: adminId,
          action: `SEND_BROADCAST_NOTIFICATION`,
          targetId: `${recipients.length} users`,
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent") || "Admin Action"
        }
      });

      return ApiResponse.success(c, { recipients: recipients.length }, "Notification envoyée.", 201);
    } catch (error: any) {
      console.error("[AdminController.sendBroadcastNotification] Error:", error);
      if (error.status === 422) {
        return ApiResponse.error(c, "VALIDATION_ERROR", error.message || "Données invalides.", 422);
      }
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors de l'envoi de la notification.", 500);
    }
  }

  /**
   * Ajoute une nouvelle version de mise à jour.
   */
  async createUpdate(c: HttpContext) {
    try {
      const payload = await c.validateUsing(createUpdateValidator);

      // Vérifier si la version existe déjà
      const existing = await prisma.updateVersioning.findFirst({
        where: { version: payload.version }
      });

      if (existing) {
        return ApiResponse.error(c, "CONFLICT", "Cette version de mise à jour existe déjà.", 409);
      }

      const update = await prisma.updateVersioning.create({
        data: {
          version: payload.version,
          changelog: payload.changelog,
          isRequired: payload.isRequired,
          minSdkVersion: payload.minSdkVersion,
          severity: payload.severity as any,
          type: payload.type as any,
          links: payload.links || [],
        }
      });

      // Audit Log
      const adminId = c.get("userId") as string;
      await prisma.auditLog.create({
        data: {
          user_id: adminId,
          action: `CREATE_UPDATE_VERSION`,
          targetId: update.id,
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent") || "Admin Action"
        }
      });

      return ApiResponse.success(c, update, "Nouvelle version de mise à jour créée avec succès.", 201);
    } catch (error: any) {
      console.error("[AdminController.createUpdate] Error:", error);
      if (error.status === 422) {
        return ApiResponse.error(c, "VALIDATION_ERROR", error.message || "Données invalides.", 422);
      }
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors de la création de la mise à jour.", 500);
    }
  }

  /**
   * Modifie le rôle d'un utilisateur (promote / demote).
   */
  async updateUserRole(c: HttpContext) {
    try {
      const userId = c.req.param("id") as string;
      const { role } = await c.req.json();

      if (!role || !["student", "staff", "admin"].includes(role)) {
        return ApiResponse.error(c, "VALIDATION_ERROR", "Rôle invalide ou manquant. Doit être student, staff ou admin.", 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return ApiResponse.error(c, "NOT_FOUND", "Utilisateur non trouvé.", 404);
      }

      // Modifier le rôle
      await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      // Log d'audit admin
      const adminId = c.get("userId") as string;
      await prisma.auditLog.create({
        data: {
          user_id: adminId,
          action: `UPDATE_USER_ROLE`,
          targetId: `${userId}:${role}`,
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent") || "Admin Action"
        }
      });

      return ApiResponse.success(c, null, "Le rôle de l'utilisateur a été mis à jour avec succès.");
    } catch (error: any) {
      console.error("[AdminController.updateUserRole] Error:", error);
      return ApiResponse.error(c, "INTERNAL_ERROR", "Erreur lors de la modification du rôle.", 500);
    }
  }
}

