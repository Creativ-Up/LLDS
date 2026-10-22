import type { AuthError } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';

// Validation des formulaires, dans l'ordre et avec les messages du prototype (submitAuth).

const EMAIL_PATTERN = /.+@.+\..+/;
export const MIN_PASSWORD_LENGTH = 8;

export interface AuthFields {
  firstName?: string;
  email: string;
  password: string;
  consent?: boolean;
}

export type AuthMode = 'login' | 'signup';

export type InvalidField = 'firstName' | 'email' | 'password' | 'consent';

export const isEmailValid = (email: string) => EMAIL_PATTERN.test(email.trim());

/** Champs invalides, à entourer de rouge après une première tentative (recalculés à la saisie). */
export function invalidFields(mode: AuthMode, fields: AuthFields): Record<InvalidField, boolean> {
  return {
    firstName: mode === 'signup' && !fields.firstName?.trim(),
    email: !isEmailValid(fields.email),
    password: !fields.password || (mode === 'signup' && fields.password.length < MIN_PASSWORD_LENGTH),
    consent: mode === 'signup' && !fields.consent,
  };
}

/** Premier message d'erreur à afficher, ou null si le formulaire est valide. */
export function validateAuth(mode: AuthMode, fields: AuthFields, t: TFunction): string | null {
  if (mode === 'signup' && !fields.firstName?.trim()) return t('auth.errors.firstName');
  if (!isEmailValid(fields.email)) return t('auth.errors.email');
  if (mode === 'signup' && fields.password.length < MIN_PASSWORD_LENGTH) return t('auth.errors.passwordLength');
  if (!fields.password) return t('auth.errors.password');
  if (mode === 'signup' && !fields.consent) return t('auth.errors.consent');
  return null;
}

/** Erreur Supabase Auth → message de l'interface. */
export function authErrorMessage(error: AuthError, t: TFunction): string {
  switch (error.code) {
    case 'invalid_credentials':
      return t('auth.errors.invalidCredentials');
    case 'user_already_exists':
    case 'email_exists':
      return t('auth.errors.emailTaken');
    case 'email_not_confirmed':
      return t('auth.errors.confirmEmail');
    case 'weak_password':
      return t('auth.errors.passwordLength');
    default:
      return error.status === 400 ? t('auth.errors.invalidCredentials') : t('errors.network');
  }
}

/** Écrans d'où l'on peut ouvrir la connexion et vers lesquels on revient ensuite. */
export const RETURN_SCREENS = ['carnet', 'lecteur'] as const;
export type ReturnScreen = (typeof RETURN_SCREENS)[number];

export function parseReturnScreen(value: string | string[] | undefined): ReturnScreen | null {
  return RETURN_SCREENS.find((screen) => screen === value) ?? null;
}
