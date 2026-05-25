import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/providers';
import { getIdentityPrivateKeyBytes } from '@/shared/crypto/keys';
import { getItem, setItem } from '@/shared/storage/async-storage';
import { Loader } from '@/shared/ui/loader';

type KeyStatus = 'pending' | 'present' | 'missing';
const FIRST_LAUNCH_KEY = "@pipolink/first_launch";

export default function Index(){
    const { isLoading, isLoggedIn, user } = useAuth();
    const [keyStatus, setKeyStatus] = useState<KeyStatus>('pending');
    const [hasCheckedFirstLaunch, setHasCheckedFirstLaunch] = useState(false);

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

    useEffect(() => {
        async function bootstrap() {
            const isFirstLaunch = await getItem(FIRST_LAUNCH_KEY)

            if (isFirstLaunch === null) {
                await setItem(FIRST_LAUNCH_KEY, 'done');
                setHasCheckedFirstLaunch(true);
            }
        }

        bootstrap();
    }, []);

    if (hasCheckedFirstLaunch) {
        return <Redirect href={'/modal/request-permission'} />
    }

    if (isLoading || (isLoggedIn && user?.is_configured && keyStatus === 'pending')) {
        return <Loader />;
    }

    if (isLoggedIn && user && !user.is_configured) {
        return <Redirect href={'/auth/onboarding'} />;
    }

    if (isLoggedIn && user?.is_configured && keyStatus === 'missing') {
        return <Redirect href={'/devices/key-recovery'} />;
    }

    if (isLoggedIn && user?.is_configured) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/auth/login" />;
}
