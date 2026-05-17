import { useTranslation } from 'react-i18next';

import type { AppLanguage } from '@/i18n';
import { getStoredLanguage, setStoredLanguage } from '@/providers/i18n-provider';

export function useLanguage() {
  const { i18n } = useTranslation();
  const language = (i18n.language?.startsWith('fr') ? 'fr' : 'en') as AppLanguage;

  return {
    language,
    setLanguage: async (lang: AppLanguage) => {
      await setStoredLanguage(lang);
    },
    reload: getStoredLanguage,
  };
}
