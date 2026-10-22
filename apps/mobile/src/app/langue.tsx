import { LANGS, type Lang } from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { BackButton, ONBOARDING_STEPS, Stepper } from '@/components/chrome';
import { Screen } from '@/components/screen';
import { StationPicker, type StationOption } from '@/components/station-picker';
import { useAutoAdvance } from '@/features/onboarding/use-auto-advance';
import { useStationLayout } from '@/features/onboarding/use-station-scale';
import { usePreferences } from '@/features/preferences/preferences';
import { colors, interFamily } from '@/theme';
import { useFrame } from '@/theme/layout';

/** 02 Langue */
export default function Language() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { preferences, update } = usePreferences();
  const advance = useAutoAdvance();
  const { top, scale } = useStationLayout();
  const [picked, setPicked] = useState<Lang | undefined>(preferences.lang);

  const [first, second, third] = LANGS.map(
    (lang): StationOption<Lang> => ({
      value: lang,
      label: t(`lang.${lang}`, { ns: 'common' }),
      content: <Text style={[styles.code, { fontSize: 20 * scale }]}>{lang.toUpperCase()}</Text>,
    }),
  );
  if (!first || !second || !third) return null;

  return (
    <Screen decor="language">
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/accueil'))} />
      <Stepper step={1} total={ONBOARDING_STEPS} />
      <Text style={[styles.greeting, { top: frame.top(148) }]}>{t('language.greeting')}</Text>
      <Text accessibilityRole="header" style={[styles.title, { top: frame.top(172) }]}>
        {t('language.title')}
      </Text>
      <StationPicker
        options={[first, second, third]}
        selected={picked}
        scale={scale}
        top={top}
        onPick={(lang) => {
          setPicked(lang);
          update({ lang });
          advance(() => router.push('/autorisations'));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    position: 'absolute',
    left: 32,
    fontFamily: interFamily(500),
    fontSize: 15,
    lineHeight: 15,
    letterSpacing: letterSpacingPt(0.02, 15),
    color: colors.tilleul,
  },
  title: {
    position: 'absolute',
    left: 32,
    right: 32,
    fontFamily: interFamily(600),
    fontSize: 31,
    lineHeight: 31 * 1.16,
    letterSpacing: letterSpacingPt(-0.02, 31),
    color: colors.ink,
  },
  code: {
    fontFamily: interFamily(500),
    color: colors.ink,
  },
});
