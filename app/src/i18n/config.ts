import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enChat from './locales/en/chat.json';
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import frChat from './locales/fr/chat.json';
import frCommon from './locales/fr/common.json';
import frSettings from './locales/fr/settings.json';

export const defaultNS = 'common';
export const resources = {
  en: { common: enCommon, settings: enSettings, chat: enChat },
  fr: { common: frCommon, settings: frSettings, chat: frChat },
} as const;

export type AppLanguage = keyof typeof resources;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS,
  ns: ['common', 'settings', 'chat'],
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
