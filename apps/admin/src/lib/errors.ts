import { t } from '@/lib/i18n';

interface DbError {
  message: string;
  code?: string;
  details?: string | null;
}

const isDbError = (value: unknown): value is DbError =>
  typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';

/** Message lisible pour une erreur Supabase / Postgres (codes levés par les fonctions SQL). */
export function errorMessage(error: unknown): string {
  if (!isDbError(error)) return t('errors.generic', { message: String(error) });
  if (error.message === 'line_not_publishable') return t('line.toasts.cantPublish');
  if (error.message === 'forbidden' || error.code === '42501') return t('errors.forbidden');
  return t('errors.generic', { message: error.message });
}

export function isUniqueViolation(error: unknown): boolean {
  return isDbError(error) && error.code === '23505';
}

/** Lève l'erreur Supabase (ou l'absence de données) : utile avec React Query. */
export function unwrap<T>(result: { data: T; error: unknown }): NonNullable<T> {
  const { data, error } = result;
  if (error) throw error;
  if (data == null) throw new Error('no_data');
  return data;
}
