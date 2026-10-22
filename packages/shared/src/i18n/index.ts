import type { Lang } from '../schemas/enums';
import { adminFr } from './locales/admin.fr';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { nl } from './locales/nl';
import type { AdminResources, Namespace, TranslationResources } from './types';

export type { AdminResources, Namespace, TranslationResources };
export { fr };

/** Ressources de l'app mobile (FR, NL, EN). */
export const resources: Record<Lang, TranslationResources> = { fr, nl, en };
export const NAMESPACES = ['common', 'mobile'] as const satisfies readonly Namespace[];
export const DEFAULT_NAMESPACE = 'common' satisfies Namespace;

/** Ressources du back-office (français). */
export const adminResources: { fr: AdminResources } = { fr: { common: fr.common, admin: adminFr } };
export const ADMIN_NAMESPACES = ['common', 'admin'] as const;
