import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, View } from 'react-native';

import { RedButton } from '@/components/buttons';
import { ErrorBanner, TextField } from '@/components/fields';
import { FormScreen } from '@/components/form-screen';
import { Subtitle, Title } from '@/components/typography';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/auth-form';
import { supabase } from '@/lib/supabase';

/**
 * Nouveau mot de passe (ouvert par le lien reçu par e-mail ; même style que la connexion).
 * La session de réinitialisation est ouverte à la réception du lien (cf. AuthProvider).
 */
export default function NewPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    // Comme sur le web, l'envoi retire le focus : contours d'erreur et bandeau visibles.
    Keyboard.dismiss();
    setTried(true);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.errors.passwordLength'));
      return;
    }
    setError(null);
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(t('auth.linkExpired'));
      return;
    }
    router.replace('/langue');
  }

  return (
    <FormScreen onBack={() => router.replace('/connexion')}>
      <View style={styles.heading}>
        <Title>{t('auth.newPasswordTitle')}</Title>
        <Subtitle>{t('auth.newPasswordSubtitle')}</Subtitle>
      </View>
      <View style={styles.form}>
        <TextField
          label={t('auth.newPassword')}
          placeholder={t('auth.passwordMin')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(null);
          }}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          invalid={tried && password.length < MIN_PASSWORD_LENGTH}
        />
        {error && <ErrorBanner message={error} />}
        <RedButton label={busy ? t('auth.busy') : t('auth.savePassword')} onPress={submit} disabled={busy} />
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
});
