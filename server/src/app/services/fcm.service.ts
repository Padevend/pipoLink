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

import { prisma } from "../../../config/database.js";

export class FCMService {
  /**
   * Envoie une notification PUSH via FCM et/ou Expo Push API.
   * @param tokens Liste des tokens FCM et/ou Expo des destinataires
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
    if (!tokens || tokens.length === 0) return;

    const fcmTokens = tokens.filter(t => !t.startsWith('ExponentPushToken') && !t.startsWith('ExpoPushToken'));
    const expoTokens = tokens.filter(t => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));

    // --- 1. Envoi via Firebase Cloud Messaging ---
    if (fcmTokens.length > 0) {
      if (getApps().length === 0) {
        console.warn("Firebase non configuré, impossible d'envoyer la notification Push aux tokens FCM.");
      } else {
        try {
          const messaging = getMessaging();
          const response = await messaging.sendEachForMulticast({
            tokens: fcmTokens,
            notification: { title, body },
            data: data ?? {},
            android: {
              priority: "high",
              notification: {
                sound: "default",
                channelId: "pipolink-v2",
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
            // Purge des tokens invalides/expirés de la base de données
            void this.purgeInvalidTokens(fcmTokens, response.responses);
          }
        } catch (error) {
          console.error("[FCM] Erreur lors de l'envoi de notification :", error);
        }
      }
    }

    // --- 2. Envoi via Expo Push API (pour Expo Go et Dev Clients) ---
    if (expoTokens.length > 0) {
      try {
        const messages = expoTokens.map(token => ({
          to: token,
          sound: 'default',
          title,
          body,
          data: data ?? {},
          channelId: 'pipolink',
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          console.error('[Expo Push] Erreur API:', await response.text());
        }
      } catch (error) {
        console.error('[Expo Push] Erreur d\'envoi:', error);
      }
    }
  }

  /**
   * Envoie un push DATA-ONLY (sans bloc `notification`) : l'app cliente
   * l'intercepte (même tuée via le background handler) et affiche elle-même
   * la notification après déchiffrement. Tokens Expo hérités : notification
   * générique (pas de handler headless possible).
   */
  async sendDataPush(tokens: string[], data: Record<string, string>) {
    if (!tokens || tokens.length === 0) return;

    const fcmTokens = tokens.filter(t => !t.startsWith('ExponentPushToken') && !t.startsWith('ExpoPushToken'));
    const expoTokens = tokens.filter(t => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));

    // Garde 4 KB FCM : on retire cipherText/iv si le payload est trop gros
    let payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) payload[k] = String(v ?? '');
    if (JSON.stringify(payload).length > 3800) {
      const { cipherText, iv, ...rest } = payload;
      payload = rest;
    }

    if (fcmTokens.length > 0) {
      if (getApps().length === 0) {
        console.warn("Firebase non configuré, impossible d'envoyer le push data-only.");
      } else {
        const messaging = getMessaging();
        for (let i = 0; i < fcmTokens.length; i += 500) {
          const chunk = fcmTokens.slice(i, i + 500);
          try {
            const response = await messaging.sendEachForMulticast({
              tokens: chunk,
              data: payload,
              android: { priority: "high" },
              apns: {
                headers: {
                  "apns-push-type": "background",
                  "apns-priority": "5",
                },
                payload: { aps: { "content-available": 1 } },
              },
            });
            if (response.failureCount > 0) {
              void this.purgeInvalidTokens(chunk, response.responses);
            }
          } catch (error) {
            console.error("[FCM] Erreur lors de l'envoi data-only :", error);
          }
        }
      }
    }

    if (expoTokens.length > 0) {
      try {
        const messages = expoTokens.map(token => ({
          to: token,
          sound: 'default',
          title: 'PipoLink',
          body: payload.type === 'MESSAGE' ? 'Nouveau message' : (payload.title || 'Nouvelle notification'),
          data: payload,
          channelId: 'pipolink-v2',
        }));
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });
        if (!response.ok) {
          console.error('[Expo Push] Erreur API:', await response.text());
        }
      } catch (error) {
        console.error('[Expo Push] Erreur d\'envoi:', error);
      }
    }
  }

  /**
   * Purge les tokens FCM invalides ou expirés de la base de données.
   * Appelé automatiquement après un envoi multicast qui contient des erreurs.
   */
  private async purgeInvalidTokens(
    tokens: string[],
    responses: Array<{ success: boolean; error?: { code: string } }>,
  ): Promise<void> {
    const INVALID_CODES = new Set([
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument',
    ]);

    const invalidTokens: string[] = [];

    for (let i = 0; i < responses.length; i++) {
      const res = responses[i];
      if (!res.success && res.error && INVALID_CODES.has(res.error.code)) {
        invalidTokens.push(tokens[i]);
      }
    }

    if (invalidTokens.length === 0) return;

    try {
      const result = await prisma.device.updateMany({
        where: { fcm_token: { in: invalidTokens } },
        data: { fcm_token: null },
      });
      console.log(`[FCM] ${result.count} token(s) invalide(s) supprimé(s) de la base.`);
    } catch (err) {
      console.error('[FCM] Erreur lors de la purge des tokens invalides:', err);
    }
  }
}
