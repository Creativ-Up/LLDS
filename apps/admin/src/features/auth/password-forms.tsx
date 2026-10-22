'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';

import { useToast } from '@/components/ui/toast';
import { t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { getSupabase } from '@/lib/supabase/client';

import { AuthError, AuthField, AuthHeading, AuthSubmit, authLinkClass } from './auth-ui';

const MIN_PASSWORD_LENGTH = 8;

/** Demande d'un lien de réinitialisation (redirigé vers « Nouveau mot de passe »). */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!z.email().safeParse(value).success) {
      setError(t('login.errors.email'));
      return;
    }
    setError(null);
    setSubmitting(true);
    const callback = new URL(ROUTES.authCallback, window.location.origin);
    callback.searchParams.set('next', ROUTES.resetPassword);
    const { error: sendError } = await getSupabase().auth.resetPasswordForEmail(value, { redirectTo: callback.toString() });
    setSubmitting(false);
    if (sendError) setError(t('errors.generic', { message: sendError.message }));
    else setSentTo(value);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-[22px]">
        <AuthHeading title={t('forgot.sentTitle')} subtitle={t('forgot.sentText', { email: sentTo })} />
        <p className="m-0 text-[13px] leading-[1.45] text-grey">{t('forgot.spam')}</p>
        <Link href={ROUTES.login} className={authLinkClass}>
          {t('forgot.back')}
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <AuthHeading title={t('forgot.title')} subtitle={t('forgot.text')} />
      {error && <AuthError>{error}</AuthError>}
      <AuthField
        id="email"
        label={t('login.email')}
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={error ? true : undefined}
      />
      <AuthSubmit disabled={submitting}>{submitting ? t('login.submitting') : t('forgot.submit')}</AuthSubmit>
      <Link href={ROUTES.login} className={authLinkClass}>
        {t('forgot.back')}
      </Link>
    </form>
  );
}

/** Choix du nouveau mot de passe (session ouverte par le lien reçu par e-mail). */
export function ResetPasswordForm() {
  const router = useRouter();
  const notify = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('resetPassword.tooShort'));
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(t('resetPassword.expired'));
      return;
    }
    notify(t('resetPassword.done'));
    router.replace(ROUTES.dashboard);
    router.refresh();
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <AuthHeading title={t('resetPassword.title')} subtitle={t('resetPassword.subtitle')} />
      {error && <AuthError>{error}</AuthError>}
      <AuthField
        id="password"
        label={t('resetPassword.password')}
        type="password"
        autoComplete="new-password"
        placeholder={t('resetPassword.placeholder')}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={error ? true : undefined}
      />
      <AuthSubmit disabled={submitting}>{submitting ? t('login.submitting') : t('resetPassword.submit')}</AuthSubmit>
    </form>
  );
}
