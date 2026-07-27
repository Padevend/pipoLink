import { useToast } from '@/providers';
import { copyToClipboard as copyUtil } from '@/shared/utils/clipboard';
import { useCallback } from 'react';

/**
 * Hook personnalisé facilitant la copie de texte avec retour visuel Toast.
 */
export function useCopyToClipboard() {
  const { showToast } = useToast();

  const copy = useCallback(
    async (text: string, successMessage = 'Texte copié dans le presse-papier') => {
      const success = await copyUtil(text);
      if (success) {
        showToast({
          type: 'success',
          message: successMessage,
        });
      } else {
        showToast({
          type: 'error',
          message: 'Impossible de copier le texte',
        });
      }
      return success;
    },
    [showToast],
  );

  return { copyToClipboard: copy };
}
