import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, Text, View } from 'react-native';

import { RedButton, TextLink } from '@/components/buttons';
import { Checkbox, ErrorBanner, TextField } from '@/components/fields';
import { FormScreen } from '@/components/form-screen';
import { Subtitle, Title } from '@/components/typography';
import { authErrorMessage, invalidFields, parseReturnScreen, validateAuth } from '@/features/auth/auth-form';
import { usePreferences } from '@/features/preferences/preferences';
import { supabase } from '@/lib/supabase';
import { colors, interFamily } from '@/theme';

/** 01c Inscription */
export default function Signup() {
  const router = useRouter();
  const { t } = useTranslation();
  const { lang, update } = usePreferences();
  const params = useLocalSearchParams<{ retour?: string }>();
  const returnTo = parseReturnScreen(params.retour);

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fields = { firstName, email, password, consent };
  const invalid = invalidFields('signup', fields);
  const clearError = () => setError(null);

  async function submit() {
    // Comme sur le web, l'envoi retire le focus : contours d'erreur et bandeau visibles.
    Keyboard.dismiss();
    setTried(true);
    const problem = validateAuth('signup', fields, t);
    if (problem) {
      setError(problem);
      return;
    }
    clearError();
    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { first_name: firstName.trim(), lang } },
    });
    setBusy(false);
    if (signUpError) {
      setError(authErrorMessage(signUpError, t));
      return;
    }
    if (!data.session) {
      // Confirmation par e-mail activée sur le projet : pas de session immédiate.
      setError(t('auth.errors.confirmEmail'));
      return;
    }
    update({ guest: false });
    if (returnTo) router.back();
    else router.replace('/langue');
  }

  return (
    <FormScreen
      decor="auth"
      footer={
        <View style={styles.loginRow}>
          <Text style={styles.footerText}>{t('auth.alreadyRegistered')}</Text>
          <TextLink
            onPress={() => router.replace({ pathname: '/connexion', params: returnTo ? { retour: returnTo } : {} })}
            color={colors.red}
            weight={500}
          >
            {t('auth.login')}
          </TextLink>
        </View>
      }
    >
      <View style={styles.heading}>
        <Title>{t('auth.signupTitle')}</Title>
        <Subtitle>{t('auth.signupSubtitle')}</Subtitle>
      </View>
      <View style={styles.form}>
        <TextField
          label={t('auth.firstName')}
          placeholder={t('auth.firstNamePlaceholder')}
          value={firstName}
          onChangeText={(value) => {
            setFirstName(value);
            clearError();
          }}
          autoComplete="given-name"
          textContentType="givenName"
          invalid={tried && invalid.firstName}
        />
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
          placeholder={t('auth.passwordMin')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearError();
          }}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          invalid={tried && invalid.password}
        />
        <Checkbox checked={consent} invalid={tried && invalid.consent} onToggle={() => setConsent((value) => !value)}>
          <Trans
            t={t}
            i18nKey="auth.consent"
            components={{ terms: <Text style={styles.underline} />, privacy: <Text style={styles.underline} /> }}
          />
        </Checkbox>
        {error && <ErrorBanner message={error} />}
        <RedButton label={busy ? t('auth.busy') : t('auth.submitSignup')} onPress={submit} disabled={busy} />
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
    gap: 16,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: interFamily(400),
    fontSize: 15,
    color: colors.ink,
  },
});
