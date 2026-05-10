export type AppEnvironment = {
  apiUrl: string;
  wsUrl: string;
};

export const env: AppEnvironment = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.pipolink.local',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'wss://realtime.pipolink.local',
};
