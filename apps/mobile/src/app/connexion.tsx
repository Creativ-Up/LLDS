import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, Text, View } from 'react-native';

import { OutlineButton, RedButton, TextLink } from '@/components/buttons';
import { ErrorBanner, OrDivider, TextField } from '@/components/fields';
import { FormScreen } from '@/components/form-screen';
import { Subtitle, Title } from '@/components/typography';
import { authErrorMessage, invalidFields, parseReturnScreen, validateAuth } from '@/features/auth/auth-form';
import { usePreferences } from '@/features/preferences/preferences';
import { supabase } from '@/lib/supabase';
import { colors, interFamily } from '@/theme';

/** 01b Connexion */
export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const { update } = usePreferences();
  const params = useLocalSearchParams<{ retour?: string }>();
  const returnTo = parseReturnScreen(params.retour);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fields = { email, password };
  const invalid = invalidFields('login', fields);

  async function submit() {
    // Comme sur le web, l'envoi retire le focus : contours d'erreur et bandeau visibles.
    Keyboard.dismiss();
    setTried(true);
    const problem = validateAuth('login', fields, t);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (signInError) {
      setError(authErrorMessage(signInError, t));
      return;
    }
    update({ guest: false });
    // Ouvert depuis le Carnet ou le Lecteur : on y revient (lecture reprise).
    if (returnTo) router.back();
    else router.replace('/langue');
  }

  const clearError = () => setError(null);

  return (
    <FormScreen
      decor="auth"
      footer={
        <View style={styles.footer}>
          <OrDivider label={t('auth.or')} />
          <OutlineButton
            label={t('auth.guest')}
            height={52}
            onPress={() => {
              update({ guest: true });
              router.replace('/langue');
            }}
          />
          <View style={styles.signupRow}>
            <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
            <TextLink
              onPress={() => router.replace({ pathname: '/inscription', params: returnTo ? { retour: returnTo } : {} })}
              color={colors.red}
              weight={500}
            >
              {t('auth.createAccount')}
            </TextLink>
          </View>
        </View>
      }
    >
      <View style={styles.heading}>
        <Title>{t('auth.loginTitle')}</Title>
        <Subtitle>{t('auth.loginSubtitle')}</Subtitle>
      </View>
      <View style={styles.form}>
        <TextField
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            clearError();
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          invalid={tried && invalid.email}
        />
        <TextField
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearError();
          }}
          password
          autoComplete="current-password"
          textContentType="password"
          invalid={tried && invalid.password}
        />
        <TextLink
          onPress={() => router.push({ pathname: '/mot-de-passe-oublie', params: email.trim() ? { email: email.trim() } : {} })}
          size={14}
          style={styles.forgot}
        >
          {t('auth.forgot')}
        </TextLink>
        {error && <ErrorBanner message={error} />}
        <RedButton label={busy ? t('auth.busy') : t('auth.submitLogin')} onPress={submit} disabled={busy} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 10,
  },
  form: {
    marginTop: 40,
    gap: 18,
  },
  forgot: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
  },
  footer: {
    gap: 24,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  footerText: {
    fontFamily: interFamily(400),
    fontSize: 15,
    color: colors.ink,
  },
});
