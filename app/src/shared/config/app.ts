export const APP_CONFIG = {
  name: 'PipoLink',
  version: '1.0.0',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'wss://api-plink.lyrastudio.org/ws',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api-plink.lyrastudio.org',
  links: {
    message_decryption_docs: "https://pipolink.lyrastudio.org/docs/message-decryption",
    ticky_brand: "https://ticky-landing.azaraits.cloud"
  }
} as const;
