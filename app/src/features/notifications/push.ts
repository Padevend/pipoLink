import { router } from 'expo-router';
import type { RawMessage } from '@/shared/api/normalize-message';
import { normalizeMessage } from '@/shared/api/normalize-message';
import { WS_EVENTS } from '@/shared/constants/ws-events';
import { decryptMessage } from '@/shared/crypto/message';
import { AsyncStorageService } from '@/shared/lib/storage';
import { on, wsManager } from '@/shared/websocket/manager';
import Constants from 'expo-constants';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';

import { displayPush, ensureChannel, type PushData } from './background-handler';
import { fetchJson } from '@/shared/api/fetch';

const ENABLED_KEY = 'notifications_enabled';

type NotifeeModule = typeof import('@notifee/react-native');
type MessagingModule = typeof import('@react-native-firebase/messaging');

/** Expo Go ne supporte pas les modules natifs RNFB/Notifee. */
function isExpoGo(): boolean {
  try {
    return Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

let notifeeModule: NotifeeModule | null | undefined;
let messagingModule: MessagingModule | null | undefined;

function getNotifee(): NotifeeModule | null {
  if (notifeeModule !== undefined) return notifeeModule;
  if (isExpoGo()) {
    notifeeModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifeeModule = require('@notifee/react-native') as NotifeeModule;
  } catch (e) {
    if (__DEV__) console.warn('[push] notifee unavailable:', e);
    notifeeModule = null;
  }
  return notifeeModule;
}

function getMessaging(): MessagingModule | null {
  if (messagingModule !== undefined) return messagingModule;
  if (isExpoGo()) {
    messagingModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    messagingModule = require('@react-native-firebase/messaging') as MessagingModule;
  } catch (e) {
    if (__DEV__) console.warn('[push] rnfb messaging unavailable:', e);
    messagingModule = null;
  }
  return messagingModule;
}

export function arePushNotificationsSupported(): boolean {
  return getNotifee() !== null && getMessaging() !== null;
}

export async function isPushEnabled(): Promise<boolean> {
  return (await AsyncStorageService.get<boolean>(ENABLED_KEY)) ?? true;
}

/** Dédup foreground : WS local notif vs FCM onMessage (LRU cap 100). */
const seenMessageIds = new Set<string>();
function markSeen(messageId: string): boolean {
  if (seenMessageIds.has(messageId)) return false;
  if (seenMessageIds.size >= 100) {
    const oldest = seenMessageIds.values().next().value;
    if (oldest !== undefined) seenMessageIds.delete(oldest);
  }
  seenMessageIds.add(messageId);
  return true;
}

async function syncFcmTokenToBackend(token: string): Promise<void> {
  try {
    await fetchJson('/devices/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] syncFcmTokenToBackend failed:', e);
    }
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  const notifee = getNotifee();
  const msg = getMessaging();
  if (!notifee || !msg || !(await isPushEnabled())) return null;

  try {
    const settings = await notifee.default.requestPermission();
    // 1 = AuthorizationStatus.AUTHORIZED, 2 = PROVISIONAL
    if (settings.authorizationStatus < 1) return null;

    await ensureChannel();

    const token = await msg.default().getToken();
    if (token) {
      syncFcmTokenToBackend(token);
    }
    return token ?? null;
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] registerForPushNotifications failed:', e);
    }
    return null;
  }
}

function navigateFromNotificationData(data?: Record<string, unknown>): void {
  if (data && typeof data.conversationId === 'string' && data.conversationId) {
    const conversationId = data.conversationId;
    setTimeout(() => {
      router.push(`/chat/${conversationId}` as any);
    }, 300);
  }
}

/**
 * Écouteurs de taps sur notification :
 * - foreground/background press via notifee.onForegroundEvent
 * - cold start via notifee.getInitialNotification()
 * - onMessage FCM (app ouverte, WS down) + onTokenRefresh
 */
export function setupNotificationResponseListener(): () => void {
  const notifee = getNotifee();
  const msg = getMessaging();
  if (!notifee || !msg) return () => {};

  const unsubs: (() => void)[] = [];

  try {
    unsubs.push(
      notifee.default.onForegroundEvent(({ type, detail }) => {
        if (type === notifee.EventType.PRESS) {
          navigateFromNotificationData(detail.notification?.data);
        }
      }),
    );

    void notifee.default.getInitialNotification().then((initial) => {
      if (initial) {
        navigateFromNotificationData(initial.notification.data);
      }
    });

    // App ouverte : le WS est la source primaire. FCM onMessage ne prend le
    // relais que si le WS est down, avec dédup par messageId.
    unsubs.push(
      msg.default().onMessage(async (remoteMessage) => {
        if (!(await isPushEnabled())) return;
        if (wsManager.getStatus() === 'connected') return;
        const data = (remoteMessage.data ?? {}) as PushData;
        if (data.type === 'MESSAGE' && data.messageId && !markSeen(data.messageId)) return;
        await displayPush(data);
      }),
    );

    unsubs.push(msg.default().onTokenRefresh((token) => void syncFcmTokenToBackend(token)));
  } catch (e) {
    if (__DEV__) console.warn('[push] setupNotificationResponseListener failed:', e);
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const notifee = getNotifee();
  if (!notifee || !(await isPushEnabled())) return;

  try {
    const channelId = await ensureChannel();
    await notifee.default.displayNotification({
      id: typeof data?.messageId === 'string' ? data.messageId : undefined,
      title,
      body,
      data: (data ?? {}) as Record<string, string>,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default', launchActivity: 'default' },
      },
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

type NotificationCreatedPayload = {
  title?: string;
  body?: string;
  type?: string;
  conversationId?: string;
  messageId?: string;
  announcementId?: string;
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

      // ── Dédup avec le canal FCM ────────────────────────────────────
      if (!markSeen(message.id)) return;

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
    on<NotificationCreatedPayload>(WS_EVENTS.NOTIFICATION_CREATED, async (payload) => {
      // Les notifs de messages/annonces sont déjà couvertes par leurs propres canaux
      if (payload?.messageId || payload?.announcementId) return;
      if (payload?.title || payload?.body) {
        await showLocalNotification(payload.title ?? 'PipoLink', payload.body ?? '');
      }
    }),
    on<{ title?: string; content?: string }>(WS_EVENTS.ANNOUNCEMENT_CREATED, async (payload) => {
      await showLocalNotification(
        typeof payload?.title === 'string' ? payload.title : 'Nouvelle annonce',
        typeof payload?.content === 'string'
          ? payload.content.slice(0, 180)
          : 'Une annonce a été publiée',
      );
    }),
    on(WS_EVENTS.DEVICE_LINKED, async () => {
      await showLocalNotification('PipoLink', 'Un nouvel appareil a été lié à votre compte');
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
