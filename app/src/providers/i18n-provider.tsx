import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useEffect, useState } from 'react';

import i18n from '@/i18n';
import type { AppLanguage } from '@/i18n';
import { getJson, setJson } from '@/shared/storage/async-storage';

const LANG_KEY = 'app_language';

export async function getStoredLanguage(): Promise<AppLanguage> {
  return getJson<AppLanguage>(LANG_KEY, 'en');
}

export async function setStoredLanguage(lang: AppLanguage): Promise<void> {
  await setJson(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
}

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getStoredLanguage().then((lang) => {
      void i18n.changeLanguage(lang).then(() => setReady(true));
    });
  }, []);

  if (!ready) return <>{children}</>;
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
