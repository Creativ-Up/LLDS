import type { adminFr } from './locales/admin.fr';
import type { fr } from './locales/fr';

type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

/** Textes de l'app mobile : le français fait référence, NL et EN doivent avoir les mêmes clés. */
export type TranslationResources = DeepStrings<typeof fr>;
export type Namespace = keyof TranslationResources;

/** Textes du back-office (français uniquement, docs/ADMIN.md) + textes communs. */
export type AdminResources = { common: TranslationResources['common']; admin: typeof adminFr };
