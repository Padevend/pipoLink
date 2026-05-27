export const SECURE_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  EXPIRES_AT: 'expires_at',
  DEVICE_ID: 'device_id',
  DEVICE_FINGERPRINT: 'device_fingerprint',
  IDENTITY_PRIVATE_KEY: 'identity_private_key',
  IDENTITY_SIGNING_PRIVATE_KEY: 'identity_signing_private_key',
  IDENTITY_PUBLIC_KEY: 'identity_public_key',
} as const;

export const ASYNC_STORAGE_KEYS = {
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  APP_LANGUAGE: 'app_language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
