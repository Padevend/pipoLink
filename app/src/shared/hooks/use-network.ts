import { useEffect, useState } from 'react';

export function useNetwork(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NetInfo = require('@react-native-community/netinfo').default as {
        addEventListener: (cb: (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void) => () => void;
        fetch: () => Promise<{ isConnected: boolean | null; isInternetReachable: boolean | null }>;
      };
      const unsub = NetInfo.addEventListener((state) => {
        setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
      });
      void NetInfo.fetch().then((state) => {
        setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
      });
      return unsub;
    } catch {
      return undefined;
    }
  }, []);

  return { isOnline };
}
