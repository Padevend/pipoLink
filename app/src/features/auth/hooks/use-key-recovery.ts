import { useEffect, useState } from 'react';

import { getIdentityPrivateKeyBytes } from '@/shared/crypto/keys';

/** Détecte l'absence de clé privée locale (réinstallation, etc.) — agent.md §12. */
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
