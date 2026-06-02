export const APP_CONFIG = {
  name: 'PipoLink',
  version: '1.0.0',
  wsUrl: 'wss://api-plink.lyrastudio.org/ws',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api-plink.lyrastudio.org',
} as const;
