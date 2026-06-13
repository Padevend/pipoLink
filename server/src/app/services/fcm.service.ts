import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createRequire } from "node:module";
import path from "node:path";

const account_path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

// Initialise Firebase Admin une seule fois au démarrage du module
if (getApps().length === 0) {
  try {
    if (account_path) {
      // Chargement du fichier JSON du compte de service via require
      const _require = createRequire(import.meta.url);
      const serviceAccount = _require(path.resolve(process.cwd(), account_path));

      initializeApp({ credential: cert(serviceAccount) });
      console.log("✅ Firebase Admin initialisé via le fichier de compte de service.");
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Utilise la variable d'environnement standard Google
      initializeApp({ credential: applicationDefault() });
      console.log("✅ Firebase Admin initialisé via applicationDefault.");
    } else {
      console.warn("⚠️ Firebase Admin non configuré : FIREBASE_SERVICE_ACCOUNT_PATH ou GOOGLE_APPLICATION_CREDENTIALS est requis.");
    }
  } catch (error) {
    console.error("⚠️ Erreur lors de l'initialisation de Firebase Admin :", error);
  }
}

export class FCMService {
  /**
   * Envoie une notification PUSH via FCM.
   * @param tokens Liste des tokens FCM des destinataires
   * @param title  Titre de la notification
   * @param body   Corps de la notification
   * @param data   Données silencieuses (conversationId, messageId, etc.)
   */
  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (getApps().length === 0) {
      console.warn("Firebase non configuré, impossible d'envoyer la notification Push.");
      return;
    }

    if (!tokens || tokens.length === 0) return;

    try {
      const messaging = getMessaging();

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data ?? {},
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "pipolink",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              contentAvailable: true,
            },
          },
        },
      });

      if (response.failureCount > 0) {
        console.warn(`[FCM] Échec pour ${response.failureCount} notification(s).`);
        // TODO: supprimer les tokens expirés (messaging/invalid-registration-token)
      }
    } catch (error) {
      console.error("[FCM] Erreur lors de l'envoi de notification :", error);
    }
  }
}
