import type { TranslationResources } from '@llds/shared/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'admin';
    resources: TranslationResources;
  }
}
