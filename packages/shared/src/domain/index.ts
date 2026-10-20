import { i18nTextSchema, type AppSettings, type I18nText } from '../schemas/content';
import { DEFAULT_LANG, LANGS, type Lang, type TransportMode } from '../schemas/enums';

/** Texte d'un contenu dans la langue demandée, avec repli sur le français. */
export function pickText(text: I18nText, lang: Lang): string {
  return text[lang] || text[DEFAULT_LANG] || '';
}

/** Variante tolérante pour une colonne jsonb non typée (lue via Supabase), validée par zod. */
export function pickTextFrom(value: unknown, lang: Lang): string {
  const parsed = i18nTextSchema.safeParse(value);
  return parsed.success ? pickText(parsed.data, lang) : '';
}

/** Langues dans lesquelles un texte traduit est renseigné (non vide). */
export function filledLangs(text: I18nText): Lang[] {
  return LANGS.filter((lang) => (text[lang] ?? '').trim() !== '');
}

/** Vitesse (km/h) d'un mode de transport, lue dans les réglages. */
export function speedKmh(settings: AppSettings, mode: TransportMode): number {
  switch (mode) {
    case 'pied':
      return settings.walk_kmh;
    case 'velo':
      return settings.bike_kmh;
    case 'voiture':
      return settings.car_kmh;
  }
}

/** Durée estimée en minutes : longueur du tracé / vitesse du mode. */
export function estimateDurationMin(lengthM: number, kmh: number): number {
  return Math.round((lengthM / 1000 / kmh) * 60);
}
