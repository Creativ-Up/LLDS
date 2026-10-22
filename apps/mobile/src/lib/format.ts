import { roundDurationMinutes, type Lang } from '@llds/shared';
import type { TFunction } from 'i18next';

const LOCALES: Record<Lang, string> = { fr: 'fr-BE', nl: 'nl-BE', en: 'en-GB' };

export function formatNumber(lang: Lang, value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits }).format(value);
}

/** Longueur d'une ligne : « 18km » (liste) ou « 18 km » (récapitulatif). */
export function formatKm(t: TFunction, lang: Lang, meters: number, compact = false): string {
  const value = formatNumber(lang, meters / 1000, meters < 10_000 ? 1 : 0);
  return compact ? t('units.kmCompact', { value }) : t('units.km', { value });
}

/** Distance : mètres (par dizaines) sous 1 km, puis km ; « 1,2km » (liste des lignes) ou « 1,2 km » (carte). */
export function formatDistance(t: TFunction, lang: Lang, meters: number, compact = true): string {
  if (meters < 1000) return t('units.m', { value: formatNumber(lang, Math.max(10, Math.round(meters / 10) * 10), 0) });
  const value = formatNumber(lang, meters / 1000, 1);
  return compact ? t('units.kmCompact', { value }) : t('units.km', { value });
}

/** Durée estimée : « 45 min », « 4 h », « 4 h 30 ». */
export function formatDuration(t: TFunction, minutes: number): string {
  const rounded = roundDurationMinutes(minutes);
  if (rounded < 60) return t('duration.minutes', { minutes: rounded });
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? t('duration.hours', { hours }) : t('duration.hoursMinutes', { hours, minutes: String(rest).padStart(2, '0') });
}

/** Taille de téléchargement en Mo. */
export function formatMegabytes(t: TFunction, lang: Lang, bytes: number): string {
  const mo = bytes / 1024 / 1024;
  return t('units.mo', { value: formatNumber(lang, mo, mo < 10 ? 1 : 0) });
}
