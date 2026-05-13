import { api } from './client';
import { User } from './types';

export const authApi = {
  /**
   * Request OTP
   */
  requestOtp: (phone: string) =>
    api.post<void>('/auth/request-otp', { phone }),

  /**
   * Resend OTP
   */
  resendOtp: (payload: { email: string; purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' }) =>
    api.post<void>('/auth/resend-otp', payload),

  /**
   * Register a new user
   */
  register: (payload: { email: string; password: string }) => 
    api.post<{ userId: string }>('/auth/register', payload),

  /**
   * Verify OTP code
   */
  verifyOtp: (payload: { email: string; code: string; purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' }) =>
    api.post<{
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      user: User;
      deviceId?: string | null;
      requiresOnboarding?: boolean;
    }>('/auth/verify-otp', payload),

  /**
   * Login with email and password
   */
  login: (payload: {
    email: string;
    password: string;
    deviceFingerprint?: string;
    deviceName?: string;
    devicePlatform?: string;
  }) =>
    api.post<{
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      user: User;
      deviceId?: string | null;
      requiresOnboarding?: boolean;
      requiresKeySetup?: boolean;
    }>('/auth/login', payload),

  /**
   * Refresh token
   */
  refresh: (payload: { refreshToken: string }) => 
    api.post<{ accessToken: string; refreshToken: string; expiresAt: number; user: User; deviceId: string }>('/auth/refresh', payload),

  /**
   * Logout current device
   */
  logout: (payload: { refreshToken: string }) => 
    api.post<void>('/auth/logout', payload),

  /**
   * Logout all devices
   */
  logoutAll: () => 
    api.post<void>('/auth/logout-all'),

  /**
   * Change password
   */
  changePassword: (payload: { currentPassword: string; newPassword: string }) => 
    api.post<void>('/auth/change-password', payload),

  /**
   * Request password reset
   */
  forgotPassword: (payload: { email: string }) => 
    api.post<void>('/auth/forgot-password', payload),

  /**
   * Reset password with OTP
   */
  resetPassword: (payload: { email: string; code: string; newPassword: string }) => 
    api.post<void>('/auth/reset-password', payload),

  /**
   * Generate QR code token
   */
  generateQr: () => 
    api.get<{ token: string; expiresAt: string }>('/auth/qr/generate'),
};
