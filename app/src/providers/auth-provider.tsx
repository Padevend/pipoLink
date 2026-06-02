import { authApi } from '@/shared/api/auth';
import { normalizeUser, type UserWithProfile } from '@/shared/api/normalize-user';
import type { User } from '@/shared/api/types';
import { userApi } from '@/shared/api/user';
import { ASYNC_STORAGE_KEYS, AsyncStorageService, SECURE_STORAGE_KEYS, SecureStorageService } from '@/shared/lib/storage';
import { db } from '@/shared/storage/sqlite';
import { disconnect } from '@/shared/websocket/manager';
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
    try {
      await AsyncStorageService.set(ASYNC_STORAGE_KEYS.USER_DATA, userData);
      setUser(userData);
    } catch (error) {
      console.warn('Failed to save user data:', error);
    }
  };

  const saveAuthData = async (
    tokens: { accessToken: string; refreshToken: string; expiresAt: number; deviceId?: string | null },
    userData?: UserWithProfile,
  ) => {
    await SecureStorageService.set(SECURE_STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
    await SecureStorageService.set(SECURE_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    await SecureStorageService.set(SECURE_STORAGE_KEYS.EXPIRES_AT, String(tokens.expiresAt));
    if (tokens.deviceId) {
      await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_ID, tokens.deviceId);
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
    await SecureStorageService.remove(SECURE_STORAGE_KEYS.AUTH_TOKEN);
    await SecureStorageService.remove(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStorageService.remove(SECURE_STORAGE_KEYS.EXPIRES_AT);
    await SecureStorageService.remove(SECURE_STORAGE_KEYS.DEVICE_ID);
    await AsyncStorageService.remove(ASYNC_STORAGE_KEYS.USER_DATA);

    // clear sqlite
    db.runSync(`
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS conversations;
    DROP TABLE IF EXISTS pending_messages;
    DROP TABLE IF EXISTS ai_sessions;
    DROP TABLE IF EXISTS ai_messages;
    DROP TABLE IF EXISTS documents;
    DROP TABLE IF EXISTS folders;
    DROP TABLE IF EXISTS downloads;
    DROP TABLE IF EXISTS attachment_downloads;
      `)
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await SecureStorageService.get(SECURE_STORAGE_KEYS.AUTH_TOKEN);
        const savedUser = await AsyncStorageService.get<UserWithProfile>(ASYNC_STORAGE_KEYS.USER_DATA);

        if (token && savedUser) {
          setUser(normalizeUser(savedUser));
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
