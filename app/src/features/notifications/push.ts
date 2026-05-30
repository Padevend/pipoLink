import { Platform } from 'react-native';

import type { RawMessage } from '@/shared/api/normalize-message';
import { normalizeMessage } from '@/shared/api/normalize-message';
import { WS_EVENTS } from '@/shared/constants/ws-events';
import { decryptMessage } from '@/shared/crypto/message';
import { AsyncStorageService, ASYNC_STORAGE_KEYS } from '@/shared/lib/storage';
import { on } from '@/shared/websocket/manager';
import Constants from 'expo-constants';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';

import { DEFAULT_CHANNEL_SETTINGS, type NotificationChannelSettings } from './types';

const ENABLED_KEY = 'notifications_enabled';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let handlerConfigured = false;

/** Expo Go (SDK 53+) ne supporte plus les push distantes Android — éviter le chargement du module natif. */
function isExpoGo(): boolean {
  try {
    return Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

function getNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  if (isExpoGo()) {
    notificationsModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
    if (!handlerConfigured && notificationsModule) {
      notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          
        }),
      });
      handlerConfigured = true;
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] expo-notifications unavailable:', e);
    }
    notificationsModule = null;
  }

  return notificationsModule;
}

export function arePushNotificationsSupported(): boolean {
  return getNotifications() !== null;
}

export async function isPushEnabled(): Promise<boolean> {
  return (await AsyncStorageService.get<boolean>(ENABLED_KEY)) ?? true;
}

/** Load the persisted channel settings (or fall back to built-in defaults). */
async function loadChannelSettings(): Promise<NotificationChannelSettings> {
  const stored = await AsyncStorageService.get<NotificationChannelSettings>(
    ASYNC_STORAGE_KEYS.NOTIFICATION_CHANNEL_SETTINGS,
  );
  return stored ? { ...DEFAULT_CHANNEL_SETTINGS, ...stored } : DEFAULT_CHANNEL_SETTINGS;
}

export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications || !(await isPushEnabled())) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return null;

    if (Platform.OS === 'android') {
      const cfg = await loadChannelSettings();

      await Notifications.setNotificationChannelAsync(cfg.id, {
        name: cfg.name ?? 'PipoLink',
        importance: cfg.importance as unknown as import('expo-notifications').AndroidImportance,
        vibrationPattern: cfg.enableVibrate ? (cfg.vibrationPattern ?? [0, 250, 250, 250]) : null,
        sound: cfg.sound === 'default' ? 'default' : undefined,
        showBadge: true,
        description: 'Notifications pour les nouveaux messages et annonces',
        groupId: 'pipolink',
        bypassDnd: cfg.bypassDnd,
        lightColor: cfg.lightColor,
        lockscreenVisibility: cfg.lockscreenVisibility as unknown as import('expo-notifications').AndroidNotificationVisibility,
        enableLights: cfg.enableLights,
        enableVibrate: cfg.enableVibrate,
      });
    }

    // Token distant : development build uniquement (pas Expo Go)
    if (!isExpoGo()) {
      const token = await Notifications.getExpoPushTokenAsync().catch(() => null);
      return token?.data ?? null;
    }
    return null;
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] registerForPushNotifications failed:', e);
    }
    return null;
  }
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || !(await isPushEnabled())) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] showLocalNotification failed:', e);
    }
  }
}

/** Try to decrypt a message's cipherText, returning the plaintext or a fallback. */
async function tryDecryptBody(
  conversationId: string,
  cipherText: string,
  iv: string,
): Promise<string> {
  try {
    const chatKey = await ensureChatKeyForChat(conversationId);
    const text = await decryptMessage(cipherText, iv, chatKey);
    return text ?? 'Nouveau message';
  } catch {
    return 'Nouveau message';
  }
}

type MessageCreatedPayload = {
  conversationId: string;
  message: RawMessage;
};

/**
 * Wire push notifications to incoming WebSocket events.
 *
 * @param currentUserId  The logged-in user's ID — messages sent by this user
 *                       will NOT trigger a local notification.
 */
export function setupPushFromWebSocket(currentUserId: string): () => void {
  const unsubs = [
    on<MessageCreatedPayload>(WS_EVENTS.MESSAGE_CREATED, async (payload) => {
      const message = normalizeMessage({ ...payload.message, chat_id: payload.conversationId });

      // ── Ne jamais notifier l'envoyeur lui-même ─────────────────────
      if (message.sender_id === currentUserId) return;

      // ── Déchiffrer le contenu du message ──────────────────────────
      const body = await tryDecryptBody(
        payload.conversationId,
        message.cipherText,
        message.iv,
      );

      const senderName = message.sender?.username ?? 'PipoLink';

      await showLocalNotification(senderName, body, {
        conversationId: payload.conversationId,
        messageId: message.id,
      });
    }),
    on(WS_EVENTS.NOTIFICATION_CREATED, async () => {
      await showLocalNotification('PipoLink', 'You have a new notification');
    }),
    on<{ title?: string }>(WS_EVENTS.ANNOUNCEMENT_CREATED, async (payload) => {
      await showLocalNotification(
        'Nouvelle annonce',
        typeof payload?.title === 'string' ? payload.title : 'Une annonce a été publiée',
      );
    }),
    on(WS_EVENTS.DEVICE_LINKED, async () => {
      await showLocalNotification('PipoLink', 'A new device was linked to your account');
    }),
  ];
  return () => unsubs.forEach((u) => u());
}

export async function setPushEnabled(enabled: boolean): Promise<void> {
  await AsyncStorageService.set(ENABLED_KEY, enabled);
  if (enabled) {
    await registerForPushNotifications();
  }
}
