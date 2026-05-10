export const APP_CONFIG = {
  name: 'PipoLink',
  version: '1.0.0',
  wsUrl: 'wss://realtime.pipolink.local',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.pipolink.local',
} as const;
