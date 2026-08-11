import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';

import { AsyncStorageService } from '@/shared/lib/storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 2 * 24 * 60 * 60 * 1000,
      retry: 3,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
      refetchOnMount: false,
      refetchInterval: false,
      structuralSharing: true
    },
    mutations: {
      retry: 0,
      networkMode: "online"
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
       const v = await AsyncStorageService.get<any>(key);
       return typeof v === 'string' ? v : JSON.stringify(v);
    },
    setItem: async (key, value) => await AsyncStorageService.set(key, value),
    removeItem: async (key) => await AsyncStorageService.remove(key),
  },
  key: 'tq_cache',
});

export function QueryProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        {children}
      </PersistQueryClientProvider>
    </QueryClientProvider>
  );
}

export { queryClient };
