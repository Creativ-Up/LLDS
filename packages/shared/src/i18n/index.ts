import type { Lang } from '../schemas/enums';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { nl } from './locales/nl';
import type { Namespace, TranslationResources } from './types';

export type { Namespace, TranslationResources };
export { fr };

export const resources: Record<Lang, TranslationResources> = { fr, nl, en };

export const NAMESPACES = ['common', 'mobile', 'admin'] as const satisfies readonly Namespace[];
export const DEFAULT_NAMESPACE = 'common' satisfies Namespace;
