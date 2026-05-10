import { authApi } from '@/shared/api/auth';
import { User } from '@/shared/api/types';
import { userApi } from '@/shared/api/user';
import { disconnect } from '@/shared/websocket/manager';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string }) => Promise<void>;
  verifyOtp: (payload: { email: string; code: string; purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' }) => Promise<void>;
  signInWithTokens: (tokens: { accessToken: string; refreshToken: string; expiresAt: number }, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveAuthData = async (tokens: { accessToken: string; refreshToken: string; expiresAt: number }, userData: User) => {
    await SecureStore.setItemAsync('auth_token', tokens.accessToken);
    await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
    await SecureStore.setItemAsync('expires_at', String(tokens.expiresAt));
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const clearAuthData = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('expires_at');
    await SecureStore.deleteItemAsync('user_data');
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const savedUser = await SecureStore.getItemAsync('user_data');
        
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Optionally refresh profile in background
          try {
            const freshUser = await userApi.getMe();
            await SecureStore.setItemAsync('user_data', JSON.stringify(freshUser));
            setUser(freshUser);
          } catch (e) {
            // If refresh fails, we might be unauthorized
            if ((e as any).status === 401) {
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

    initializeAuth();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isLoggedIn: Boolean(user),
    
    login: async (payload) => {
      const { accessToken, refreshToken, expiresAt, user: userData } = await authApi.login(payload);
      await saveAuthData({ accessToken, refreshToken, expiresAt }, userData);
    },
    
    register: async (payload) => {
      await authApi.register(payload);
    },
    
    verifyOtp: async (payload) => {
      const data = await authApi.verifyOtp(payload);
      console.log(data);
      if (data) {
        await saveAuthData({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: data.expiresAt }, data.user);
      }
    },
    
    signInWithTokens: async (tokens: { accessToken: string; refreshToken: string; expiresAt: number }, userData: User) => {
      await saveAuthData(tokens, userData);
    },
    
    logout: async () => {
      await clearAuthData();
      disconnect();
    },

    refreshUser: async () => {
      const freshUser = await userApi.getMe();
      await SecureStore.setItemAsync('user_data', JSON.stringify(freshUser));
      setUser(freshUser);
    }
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
