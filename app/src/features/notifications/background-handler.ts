/**
 * Handler FCM headless : enregistré depuis index.js AVANT expo-router,
 * pour que les push data-only soient affichés même app totalement fermée.
 * Contraintes : ne jamais throw, pas d'i18next (contexte headless),
 * modules natifs chargés en lazy (indisponibles dans Expo Go).
 */
import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { decryptMessage } from '@/shared/crypto/message';
import { AsyncStorageService, ASYNC_STORAGE_KEYS } from '@/shared/lib/storage';

import { DEFAULT_CHANNEL_SETTINGS, type NotificationChannelSettings } from './types';

const ENABLED_KEY = 'notifications_enabled';

type NotifeeModule = typeof import('@notifee/react-native');
type MessagingModule = typeof import('@react-native-firebase/messaging');

function loadNotifee(): NotifeeModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@notifee/react-native') as NotifeeModule;
  } catch {
    return null;
  }
}

function loadMessaging(): MessagingModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/messaging') as MessagingModule;
  } catch {
    return null;
  }
}

export type PushData = {
  type?: 'MESSAGE' | 'ANNOUNCEMENT' | 'ADMIN_BROADCAST' | string;
  notificationId?: string;
  // MESSAGE
  messageId?: string;
  chatId?: string;
  chatType?: 'private' | 'group' | string;
  chatName?: string;
  senderName?: string;
  senderId?: string;
  cipherText?: string;
  iv?: string;
  messageType?: string;
  // ANNOUNCEMENT / ADMIN_BROADCAST (contenu non-E2E)
  title?: string;
  body?: string;
  announcementId?: string;
};

async function isPushEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorageService.get<boolean>(ENABLED_KEY)) ?? true;
  } catch {
    return true;
  }
}

export async function ensureChannel(): Promise<string> {
  const notifeeMod = loadNotifee();
  let cfg: NotificationChannelSettings = DEFAULT_CHANNEL_SETTINGS;
  try {
    const stored = await AsyncStorageService.get<NotificationChannelSettings>(
      ASYNC_STORAGE_KEYS.NOTIFICATION_CHANNEL_SETTINGS,
    );
    if (stored) cfg = { ...DEFAULT_CHANNEL_SETTINGS, ...stored };
  } catch {
    // settings indisponibles en headless → défauts
  }
  if (!notifeeMod) return cfg.id;

  await notifeeMod.default.createChannel({
    id: cfg.id,
    name: cfg.name ?? 'PipoLink',
    importance: notifeeMod.AndroidImportance.HIGH,
    sound: cfg.sound === 'default' ? 'default' : undefined,
    vibration: cfg.enableVibrate,
    vibrationPattern:
      cfg.enableVibrate && cfg.vibrationPattern && cfg.vibrationPattern.length % 2 === 0
        ? cfg.vibrationPattern.slice(0, 4).map((v) => Math.max(v, 100))
        : undefined,
    lights: cfg.enableLights,
    lightColor: cfg.lightColor,
    bypassDnd: cfg.bypassDnd,
    badge: true,
  });
  return cfg.id;
}

async function tryDecrypt(chatId: string, cipherText: string, iv: string): Promise<string | null> {
  try {
    const key = await ensureChatKeyForChat(chatId);
    const text = await decryptMessage(cipherText, iv, key);
    return text ?? null;
  } catch {
    return null;
  }
}

export async function displayPush(data: PushData): Promise<void> {
  const notifeeMod = loadNotifee();
  if (!notifeeMod) return;
  try {
    if (data.type === 'MESSAGE') {
      if (!data.chatId || !data.messageId) return;

      // Ne jamais notifier l'envoyeur lui-même
      try {
        const user = await AsyncStorageService.get<{ id: string }>(ASYNC_STORAGE_KEYS.USER_DATA);
        if (user?.id && data.senderId && user.id === data.senderId) return;
      } catch {
        // en cas de doute, on affiche
      }

      const senderName = data.senderName || 'PipoLink';
      const plaintext =
        data.cipherText && data.iv ? await tryDecrypt(data.chatId, data.cipherText, data.iv) : null;

      let title: string;
      let body: string;
      if (data.chatType === 'group') {
        title = data.chatName || 'Groupe';
        body = plaintext ? `${senderName}: ${plaintext}` : `${senderName} · Nouveau message`;
      } else {
        title = senderName;
        body = plaintext ?? 'Nouveau message';
      }

      if (data.messageType && data.messageType.toUpperCase() === 'DOCUMENT') {
        body = data.chatType === 'group' ? `${senderName} · 📎 Document` : '📎 Document';
      }

      const channelId = await ensureChannel();
      await notifeeMod.default.displayNotification({
        id: data.messageId,
        title,
        body,
        data: { conversationId: data.chatId, notificationId: data.notificationId ?? data.messageId },
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      });
      return;
    }

    if (data.type === 'ANNOUNCEMENT' || data.type === 'ADMIN_BROADCAST') {
      const channelId = await ensureChannel();
      await notifeeMod.default.displayNotification({
        id: data.announcementId || undefined,
        title: data.title || 'Nouvelle annonce',
        body: data.body || '',
        data: { announcementId: data.announcementId ?? '', notificationId: data.notificationId ?? data.announcementId ?? '' },
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      });
    }
  } catch {
    // Le handler headless ne doit jamais throw
  }
}

const messagingMod = loadMessaging();
const notifeeMod = loadNotifee();

if (messagingMod && notifeeMod) {
  messagingMod.default().setBackgroundMessageHandler(async (remoteMessage) => {
    try {
      if (!(await isPushEnabled())) return;
      await displayPush((remoteMessage.data ?? {}) as PushData);
    } catch {
      // jamais de throw en headless
    }
  });

  // Obligatoire avec Notifee : un press en background relance l'activité via pressAction
  notifeeMod.default.onBackgroundEvent(async ({ type }) => {
    if (type === notifeeMod.EventType.PRESS) {
      // launchActivity 'default' gère l'ouverture ; la navigation est faite
      // au cold start via getInitialNotification() dans _layout.
    }
  });
}
