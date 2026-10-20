import { DEFAULT_LANG, LANGS, langSchema, type Lang } from '@llds/shared';
import { NAMESPACES, resources } from '@llds/shared/i18n';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

/** Première langue du téléphone prise en charge (FR / NL / EN), sinon le français. */
export function deviceLang(): Lang {
  for (const locale of getLocales()) {
    const parsed = langSchema.safeParse(locale.languageCode);
    if (parsed.success) return parsed.data;
  }
  return DEFAULT_LANG;
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  lng: deviceLang(),
  fallbackLng: DEFAULT_LANG,
  supportedLngs: [...LANGS],
  ns: [...NAMESPACES],
  defaultNS: 'mobile',
  resources,
  initAsync: false,
  interpolation: { escapeValue: false },
});

export default i18n;
