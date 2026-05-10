import { useEffect, useState } from 'react';

export function useNetwork(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const update = (): void => {
      setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    };

    update();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }

    return undefined;
  }, []);

  return { isOnline };
}
