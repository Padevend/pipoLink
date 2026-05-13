import { useEffect, useState } from 'react';

import { getIdentityPrivateKeyBytes } from '@/shared/crypto/keys';

/**
 * Détecte l'absence de clé privée locale (réinstallation, etc.).
 * Le flux QR complet est à brancher sur `use-link-device` (agent.md §10).
 */
export function useKeyRecovery() {
  const [keyMissing, setKeyMissing] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const sk = await getIdentityPrivateKeyBytes();
      setKeyMissing(!sk);
    })();
  }, []);

  return { keyMissing };
}
