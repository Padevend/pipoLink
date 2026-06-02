export type AppEnvironment = {
  apiUrl: string;
  wsUrl: string;
};

export const env: AppEnvironment = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api-plink.lyrastudio.org',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'wss://api-plink.lyrastudio.org/ws',
};
