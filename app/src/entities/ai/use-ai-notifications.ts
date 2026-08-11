import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { router } from 'expo-router';
import { useToast } from '@/providers';
import {
  AiRequestManager,
  type AiResponseReadyPayload,
  type AiRequestErrorPayload,
} from './ai-request-manager';

/**
 * Hook that listens for AI response events from the AiRequestManager
 * and shows a toast notification when the user is NOT on the corresponding chat page.
 *
 * Must be mounted once in the root layout (via <AiNotificationListener />).
 */
export function useAiNotifications() {
  const { showToast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const unsubSuccess = AiRequestManager.on('response-ready', (data: AiResponseReadyPayload) => {
      const chatPath = `/ai/${data.sessionId}`;

      // If user is currently viewing this chat, don't show toast — the UI updates via cache
      if (pathname === chatPath) return;

      const label = data.type === 'chat' ? 'répondu à votre question' : 'généré votre aide d\'étude';

      showToast({
        type: 'info',
        message: `HIRO a ${label} 💡`,
        onPress: () => {
          router.push(`/ai/${data.sessionId}` as any);
        },
      });
    });

    const unsubError = AiRequestManager.on('request-error', (data: AiRequestErrorPayload) => {
      const chatPath = `/ai/${data.sessionId}`;

      // If user is on the chat page, the UI handles errors directly
      if (pathname === chatPath) return;

      showToast({
        type: 'error',
        message: 'Échec de la requête HIRO — réessayez.',
        onPress: () => {
          router.push(`/ai/${data.sessionId}` as any);
        },
      });
    });

    return () => {
      unsubSuccess();
      unsubError();
    };
  }, [pathname, showToast]);
}
