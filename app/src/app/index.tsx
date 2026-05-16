import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';

import { useAuth } from '@/providers';
import { getIdentityPrivateKeyBytes } from '@/shared/crypto/keys';
import { Loader } from '@/shared/ui/loader';

type KeyStatus = 'pending' | 'present' | 'missing';

export default function Index(): JSX.Element {
  const { isLoading, isLoggedIn, user } = useAuth();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('pending');

  useEffect(() => {
    if (!isLoggedIn || !user?.is_configured) {
      setKeyStatus('present');
      return;
    }
    void (async () => {
      const sk = await getIdentityPrivateKeyBytes();
      setKeyStatus(sk ? 'present' : 'missing');
    })();
  }, [isLoggedIn, user?.is_configured]);

  if (isLoading || (isLoggedIn && user?.is_configured && keyStatus === 'pending')) {
    return <Loader />;
  }

  if (isLoggedIn && user && !user.is_configured) {
    return <Redirect href={'/auth/onboarding' as any} />;
  }

  if (isLoggedIn && user?.is_configured && keyStatus === 'missing') {
    return <Redirect href={'/devices/key-recovery' as any} />;
  }

  if (isLoggedIn && user?.is_configured) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}
