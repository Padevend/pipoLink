import { authApi } from '@/shared/api/auth';
import { normalizeUser, type UserWithProfile } from '@/shared/api/normalize-user';
import type { User } from '@/shared/api/types';
import { userApi } from '@/shared/api/user';
import { disconnect } from '@/shared/websocket/manager';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface AuthContextValue {
  user: UserWithProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (payload: {
    email: string;
    password: string;
    deviceFingerprint?: string;
    deviceName?: string;
    devicePlatform?: string;
  }) => Promise<void>;
  register: (payload: { email: string; password: string }) => Promise<void>;
  verifyOtp: (payload: { email: string; code: string; purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' }) => Promise<void>;
  signInWithTokens: (
    tokens: { accessToken: string; refreshToken: string; expiresAt: number; deviceId?: string | null },
    user?: User | UserWithProfile,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserWithProfile>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

async function fetchFullUser(): Promise<UserWithProfile> {
  return userApi.getMe();
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = async (userData: UserWithProfile) => {
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const saveAuthData = async (
    tokens: { accessToken: string; refreshToken: string; expiresAt: number; deviceId?: string | null },
    userData?: UserWithProfile,
  ) => {
    await SecureStore.setItemAsync('auth_token', tokens.accessToken);
    await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
    await SecureStore.setItemAsync('expires_at', String(tokens.expiresAt));
    if (tokens.deviceId) {
      await SecureStore.setItemAsync('device_id', tokens.deviceId);
    }

    const normalized = userData ? normalizeUser(userData) : null;
    const full =
      normalized?.profile != null
        ? normalized
        : await fetchFullUser().catch(() => normalized);
    if (full) {
      await persistUser(normalizeUser(full));
    }
  };

  const clearAuthData = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('expires_at');
    await SecureStore.deleteItemAsync('user_data');
    await SecureStore.deleteItemAsync('device_id').catch(() => {});
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const savedUser = await SecureStore.getItemAsync('user_data');

        if (token && savedUser) {
          setUser(normalizeUser(JSON.parse(savedUser) as UserWithProfile));
          try {
            const freshUser = await fetchFullUser();
            await persistUser(freshUser);
          } catch (e) {
            if ((e as { status?: number }).status === 401) {
              await clearAuthData();
            }
          }
        }
      } catch (e) {
        console.error('Auth initialization failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isLoggedIn: !!user,

      login: async (payload) => {
        const result = await authApi.login(payload);
        await saveAuthData(
          {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresAt: result.expiresAt,
            deviceId: result.deviceId,
          },
          result.user ? normalizeUser(result.user) : undefined,
        );
      },

      register: async (payload) => {
        await authApi.register(payload);
      },

      verifyOtp: async (payload) => {
        const data = await authApi.verifyOtp(payload);
        if (data) {
          await saveAuthData(
            {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresAt: data.expiresAt,
              deviceId: (data as { deviceId?: string }).deviceId,
            },
            data.user ? normalizeUser(data.user) : undefined,
          );
        }
      },

      signInWithTokens: async (tokens, userData) => {
        await saveAuthData(tokens, userData ? normalizeUser(userData) : undefined);
      },

      logout: async () => {
        await clearAuthData();
        disconnect();
      },

      refreshUser: async () => {
        const freshUser = await fetchFullUser();
        await persistUser(freshUser);
        return freshUser;
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
