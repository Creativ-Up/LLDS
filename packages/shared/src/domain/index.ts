import { i18nTextSchema, type AppSettings, type I18nText } from '../schemas/content';
import { DEFAULT_LANG, LANGS, type ExperienceType, type Lang, type StopMediaKind, type TransportMode } from '../schemas/enums';

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

/** Tailles (octets) des médias d'un arrêt dans une langue, pour estimer le téléchargement. */
export interface StopDownloadSizes {
  archiveBytes: number;
  presentBytes: number;
  narration: Partial<Record<StopMediaKind, number>>;
}

/**
 * Taille du téléchargement hors ligne d'une ligne : couverture + cartes postales + photos actuelles
 * + narration (vidéo pour l'expérience complète, audio seul sinon, avec repli sur l'autre format) + sous-titres.
 */
export function downloadSizeBytes(
  coverBytes: number,
  stops: StopDownloadSizes[],
  experience: ExperienceType,
): number {
  return stops.reduce((total, stop) => {
    const { video, audio, subtitles } = stop.narration;
    const narration = experience === 'complete' ? (video ?? audio ?? 0) : (audio ?? video ?? 0);
    return total + stop.archiveBytes + stop.presentBytes + narration + (subtitles ?? 0);
  }, coverBytes);
}

export * from './geo';
