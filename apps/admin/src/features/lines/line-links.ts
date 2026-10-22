import type { MissingItem } from '@/lib/data';
import { t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';

export type StopTab = 'infos' | 'media' | 'services' | 'reward';
export const STOP_TABS: readonly StopTab[] = ['infos', 'media', 'services', 'reward'];

/** Lien vers l'éditeur de ligne, avec le panneau d'un arrêt ouvert sur un onglet. */
export function lineEditorHref(lineId: string, stopId?: string, tab?: StopTab): string {
  const params = new URLSearchParams();
  if (stopId) params.set('arret', stopId);
  if (tab) params.set('onglet', tab);
  const query = params.toString();
  return query ? `${ROUTES.line(lineId)}?${query}` : ROUTES.line(lineId);
}

/** « nom FR, carte postale » */
export function missingText(items: readonly MissingItem[]): string {
  return items.map((item) => t(`missing.${item}`)).join(', ');
}
