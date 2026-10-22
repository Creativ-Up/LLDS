import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { RedButton, TextLink } from '@/components/buttons';
import { ErrorBanner, TextField } from '@/components/fields';
import { FormScreen } from '@/components/form-screen';
import { EnvelopeIcon } from '@/components/icons';
import { Strong, Title } from '@/components/typography';
import { isEmailValid } from '@/features/auth/auth-form';
import { appLink } from '@/lib/links';
import { supabase } from '@/lib/supabase';
import { colors, interFamily } from '@/theme';
import { pop, screenIn } from '@/theme/motion';

/** 01d Mot de passe oublié : envoi du lien (deep link vers « Nouveau mot de passe »). */
export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  // L'e-mail déjà saisi sur la connexion est repris.
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);

  async function send(): Promise<boolean> {
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: appLink('/nouveau-mot-de-passe'),
    });
    if (sendError) setError(t('errors.network'));
    return !sendError;
  }

  async function submit() {
    // Comme sur le web, l'envoi retire le focus : contours d'erreur et bandeau visibles.
    Keyboard.dismiss();
    setTried(true);
    if (!isEmailValid(email)) {
      setError(t('auth.errors.email'));
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await send();
    setBusy(false);
    if (ok) setSent(true);
  }

  if (sent) {
    return (
      <FormScreen
        onBack={() => router.replace('/connexion')}
        footerBottom={40}
        footer={
          <View style={styles.sentFooter}>
            <RedButton label={t('auth.backToLogin')} onPress={() => router.replace('/connexion')} />
            <TextLink
              onPress={async () => {
                if (!resent && (await send())) setResent(true);
              }}
            >
              {resent ? t('auth.resent') : t('auth.resend')}
            </TextLink>
          </View>
        }
      >
        <Animated.View entering={screenIn} style={styles.sent}>
          <Animated.View entering={pop} style={styles.envelope}>
            <Svg width={96} height={96} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
              <Circle
                cx={48}
                cy={48}
                r={45}
                fill="none"
                stroke={colors.red}
                strokeWidth={4}
                strokeDasharray="120 20 60 40"
                strokeLinecap="round"
              />
            </Svg>
            <EnvelopeIcon />
          </Animated.View>
          <Title>{t('auth.sentTitle')}</Title>
          <Text style={styles.sentText}>
            <Trans t={t} i18nKey="auth.sentText" values={{ email: email.trim() }} components={{ b: <Strong /> }} />
          </Text>
          <Text style={styles.spam}>{t('auth.spam')}</Text>
        </Animated.View>
      </FormScreen>
    );
  }

  return (
    <FormScreen onBack={() => router.replace('/connexion')}>
      <View style={styles.heading}>
        <Title>{t('auth.forgotTitle')}</Title>
        <Text style={styles.text}>{t('auth.forgotText')}</Text>
      </View>
      <View style={styles.form}>
        <TextField
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          invalid={tried && !isEmailValid(email)}
        />
        {error && <ErrorBanner message={error} />}
        <RedButton label={busy ? t('auth.busy') : t('auth.sendLink')} onPress={submit} disabled={busy} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 10,
  },
  text: {
    fontFamily: interFamily(400),
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.olive,
  },
  form: {
    marginTop: 40,
    gap: 18,
  },
  sent: {
    marginTop: 30,
    alignItems: 'flex-start',
    gap: 22,
  },
  envelope: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentText: {
    fontFamily: interFamily(400),
    fontSize: 16,
    lineHeight: 16 * 1.45,
    color: colors.ink,
  },
  spam: {
    fontFamily: interFamily(400),
    fontSize: 14,
    lineHeight: 14 * 1.45,
    color: colors.olive,
  },
  sentFooter: {
    gap: 18,
  },
});
