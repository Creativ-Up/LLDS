import { ADMIN_LOCALE, t } from '@/lib/i18n';

const number = (value: number, maximumFractionDigits: number) =>
  new Intl.NumberFormat(ADMIN_LOCALE, { maximumFractionDigits }).format(value);

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return number(value, maximumFractionDigits);
}

/** « 25,5 km » à partir d'une longueur en mètres. */
export function formatKm(meters: number): string {
  return t('units.km', { value: number(meters / 1000, 1) });
}

/** Taille lisible : « 2 Ko », « 0,6 Mo », « 38 Mo ». */
export function formatSize(bytes: number): string {
  if (bytes <= 0) return t('units.mo', { value: 0 });
  const ko = bytes / 1024;
  if (ko < 100) return t('units.ko', { value: number(Math.max(1, Math.round(ko)), 0) });
  const mo = ko / 1024;
  return t('units.mo', { value: number(mo, mo < 10 ? 1 : 0) });
}

/** Durée « m:ss ». */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** « 12 oct. 2026 » */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(ADMIN_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

/** « 02/09/2026 » */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat(ADMIN_LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

/** « 01/04 » */
export function formatDayMonth(iso: string): string {
  return new Intl.DateTimeFormat(ADMIN_LOCALE, { day: '2-digit', month: '2-digit' }).format(new Date(iso));
}

/** « 10:42 » */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(ADMIN_LOCALE, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

/** Initiales d'un nom (« Camille Dubois » → « CD »). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
