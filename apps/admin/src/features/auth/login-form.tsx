'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';

import { t } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { getSupabase } from '@/lib/supabase/client';

import { AuthError, AuthField, AuthHeading, AuthSubmit, authLinkClass } from './auth-ui';

const emailSchema = z.email();

/** A0 Connexion admin : e-mail + mot de passe (Supabase Auth), réservé au rôle admin. */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const accessRefused = params.get('acces') === 'refuse';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(accessRefused ? t('login.errors.notAdmin') : null);
  const [invalidField, setInvalidField] = useState<'email' | 'password' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accessRefused) void getSupabase().auth.signOut();
  }, [accessRefused]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailSchema.safeParse(email.trim()).success) {
      setInvalidField('email');
      setError(t('login.errors.email'));
      return;
    }
    if (!password) {
      setInvalidField('password');
      setError(t('login.errors.password'));
      return;
    }
    setInvalidField(null);
    setError(null);
    setSubmitting(true);

    const supabase = getSupabase();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setSubmitting(false);
      setError(t('login.errors.invalid'));
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError(t('login.errors.notAdmin'));
      return;
    }
    router.replace(ROUTES.dashboard);
    router.refresh();
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <AuthHeading title={t('login.title')} subtitle={t('login.subtitle')} />
      {error && <AuthError>{error}</AuthError>}
      <AuthField
        id="email"
        label={t('login.email')}
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={invalidField === 'email' || undefined}
      />
      <AuthField
        id="password"
        label={t('login.password')}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={invalidField === 'password' || undefined}
      />
      <AuthSubmit disabled={submitting}>{submitting ? t('login.submitting') : t('login.submit')}</AuthSubmit>
      <Link href={ROUTES.forgotPassword} className={authLinkClass}>
        {t('login.forgot')}
      </Link>
    </form>
  );
}
