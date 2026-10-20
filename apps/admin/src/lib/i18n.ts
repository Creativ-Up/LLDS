import { DEFAULT_LANG, type Lang } from '@llds/shared';
import { NAMESPACES, resources } from '@llds/shared/i18n';
import i18next from 'i18next';

// Le back-office est en français (docs/ADMIN.md) ; les textes passent tout de même par i18n.
export const ADMIN_LANG: Lang = DEFAULT_LANG;

const i18n = i18next.createInstance();
void i18n.init({
  lng: ADMIN_LANG,
  fallbackLng: DEFAULT_LANG,
  ns: [...NAMESPACES],
  defaultNS: 'admin',
  resources,
  initAsync: false,
  interpolation: { escapeValue: false },
});

export const t = i18n.t.bind(i18n);

/** Formatage des nombres selon la langue de l'admin (ex. « 25,5 »). */
export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(ADMIN_LANG, { maximumFractionDigits }).format(value);
}
