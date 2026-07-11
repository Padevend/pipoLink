import { api } from './client';
import { User } from './types';

export const authApi = {
  resendOtp: (payload: { email: string; purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' }) =>
    api.post<void>('/auth/resend-otp', payload),

  register: (payload: { email: string; password: string }) =>
    api.post<{ userId: string }>('/auth/register', payload),

  /** Révoque la liaison DB d'un appareil avant création d'un nouveau compte. */
  detachDeviceByFingerprint: (fingerprint: string) =>
    api.post<{ detached: boolean; deviceId?: string }>('/auth/device/detach', { fingerprint }),

  verifyOtp: (payload: { email: string; code: string; purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' }) =>
    api.post<{
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      user: User;
      deviceId?: string | null;
      requiresOnboarding?: boolean;
    }>('/auth/verify-otp', payload),

  login: (payload: {
    email: string;
    password: string;
    deviceFingerprint?: string;
    deviceName?: string;
    devicePlatform?: string;
    loginMode?: 'primary' | 'device';
  }) =>
    api.post<{
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      user: User;
      deviceId?: string | null;
      requiresOnboarding?: boolean;
      requiresKeySetup?: boolean;
      keyRecoveryMode?: 'qr_required' | 'key_recovery';
      keyBackup?: { encrypted_key: string; salt: string };
    }>('/auth/login', payload),

  backupKey: (payload: { encryptedKey: string; salt: string }) =>
    api.post<{ success: boolean }>('/auth/keys/backup', payload),

  completeRecovery: (payload: {
    deviceName: string;
    devicePlatform: string;
    deviceFingerprint: string;
    devicePublicKey: string;
    deviceKeySignature: string;
    isBypass?: boolean;
  }) =>
    api.post<{
      device: { id: string; name: string; platform: string };
      tokens: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
      };
    }>('/auth/keys/recovery/complete', payload),

  failedRecovery: () =>
    api.post<{ attemptsRemaining: number; lockedUntil: string | null }>('/auth/keys/recovery/failed'),

  refresh: (payload: { refreshToken: string }) =>
    api.post<{ accessToken: string; refreshToken: string; expiresAt: number; user: User; deviceId: string }>(
      '/auth/refresh',
      payload,
    ),

  logout: (payload: { refreshToken: string }) => api.post<void>('/auth/logout', payload),

  logoutAll: () => api.post<void>('/auth/logout-all'),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.post<void>('/auth/change-password', payload),

  forgotPassword: (payload: { email: string }) => api.post<void>('/auth/forgot-password', payload),

  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    api.post<void>('/auth/reset-password', payload),

  /**
   * Appareil secondaire : démarre l'appairage sans jeton d'accès.
   */
  initiatePairing: (payload: {
    deviceName: string;
    platform: string;
    fingerprint: string;
    publicKey: string;
    keySignature: string;
  }) =>
    api.post<{ token: string; shortCode: string; expiresAt: string }>('/auth/qr/initiate', payload),

  previewPairing: (params: { token?: string; shortCode?: string }) =>
    api.get<{
      token: string;
      shortCode: string;
      deviceName: string;
      platform: string;
      publicKey: string;
      expiresAt: string;
    }>('/auth/qr/preview', { params }),

  /** Appareil principal : approuve après scan QR ou saisie du code. */
  approvePairing: (payload: {
    token?: string;
    shortCode?: string;
    chatKeyBundle?: { chatId: string; encryptedKey: string }[];
  }) =>
    api.post<{ device: { id: string; name: string; platform: string } }>('/auth/qr/approve', payload),

  /** Appareil secondaire : récupère les jetons une fois l'appareil principal approuvé. */
  pollQrLink: (token: string) =>
    api.get<{
      status: 'pending' | 'completed';
      tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        deviceId: string | null;
        user: User;
        device: { id: string; name: string; platform: string };
      };
    }>('/auth/qr/poll', { params: { token } }),
};
