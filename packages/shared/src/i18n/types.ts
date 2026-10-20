import type { fr } from './locales/fr';

type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

/** Forme des traductions : le français fait référence, NL et EN doivent avoir les mêmes clés. */
export type TranslationResources = DeepStrings<typeof fr>;
export type Namespace = keyof TranslationResources;
