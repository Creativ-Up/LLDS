import { DEFAULT_LANG, type Lang } from '@llds/shared';
import { ADMIN_NAMESPACES, adminResources } from '@llds/shared/i18n';
import { createInstance } from 'i18next';

// Le back-office est en français (docs/ADMIN.md) ; tous les textes passent par i18n.
export const ADMIN_LANG: Lang = DEFAULT_LANG;
export const ADMIN_LOCALE = 'fr-BE';

const i18n = createInstance();
void i18n.init({
  lng: ADMIN_LANG,
  fallbackLng: ADMIN_LANG,
  ns: [...ADMIN_NAMESPACES],
  defaultNS: 'admin',
  resources: adminResources,
  initAsync: false,
  interpolation: { escapeValue: false },
});

export const t = i18n.t.bind(i18n);
