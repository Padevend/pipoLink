import { useCallback, useEffect, useRef, useState } from 'react';

import { AsyncStorageService } from '@/shared/lib/storage';

// Durée de vie d'un brouillon : 24 h (plage demandée 5 h – 1 j)
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const SAVE_DEBOUNCE_MS = 400;

type DraftEntry = { text: string; updatedAt: number };

/**
 * Brouillon local par conversation : le texte saisi dans l'input est conservé
 * (AsyncStorage) et restauré à la réouverture du chat, tant qu'il a moins de 24 h.
 * `clearDraft` doit être appelé à l'envoi du message.
 */
export function useDraft(draftKey: string) {
  const storageKey = `draft_${draftKey}`;
  const [text, setTextState] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorageService.get<DraftEntry>(storageKey).then((draft) => {
      if (cancelled || !draft?.text) return;
      if (Date.now() - (draft.updatedAt ?? 0) > DRAFT_TTL_MS) {
        void AsyncStorageService.remove(storageKey);
        return;
      }
      // Ne pas écraser une saisie déjà commencée
      setTextState((current) => (current ? current : draft.text));
    });
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [storageKey]);

  const setText = useCallback(
    (value: string) => {
      setTextState(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (value.trim()) {
          void AsyncStorageService.set(storageKey, { text: value, updatedAt: Date.now() });
        } else {
          void AsyncStorageService.remove(storageKey);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [storageKey],
  );

  const clearDraft = useCallback(() => {
    setTextState('');
    if (timerRef.current) clearTimeout(timerRef.current);
    void AsyncStorageService.remove(storageKey);
  }, [storageKey]);

  return { text, setText, clearDraft };
}
