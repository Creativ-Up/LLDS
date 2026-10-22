import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { TextLink } from '@/components/buttons';
import { BackButton } from '@/components/chrome';
import { Screen } from '@/components/screen';
import { colors, interFamily } from '@/theme';
import { useFrame } from '@/theme/layout';

/** Écran d'attente d'une destination livrée à un jalon ultérieur (M4 lecteur, M6 carnet, cachets…). */
export function PlaceholderScreen({ milestone }: { milestone: string }) {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  return (
    <Screen>
      <BackButton />
      <View style={[styles.content, { paddingTop: frame.top(160) }]}>
        <Text style={styles.text}>{t('placeholder.milestone', { milestone })}</Text>
        <TextLink onPress={() => router.dismissTo('/carte')} color={colors.red}>
          {t('placeholder.backToMap')}
        </TextLink>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 32,
    gap: 16,
    alignItems: 'flex-start',
  },
  text: {
    fontFamily: interFamily(400),
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.olive,
  },
});
