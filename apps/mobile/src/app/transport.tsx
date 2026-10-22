import Bike from '@llds/assets/icons/transport-velo.svg';
import Car from '@llds/assets/icons/transport-voiture.svg';
import Walk from '@llds/assets/icons/transport-pied.svg';
import { TRANSPORT_MODES, type TransportMode } from '@llds/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BackButton, ONBOARDING_STEPS, Stepper } from '@/components/chrome';
import { Screen } from '@/components/screen';
import { StationPicker, type StationOption } from '@/components/station-picker';
import { Subtitle, Title } from '@/components/typography';
import { useAutoAdvance } from '@/features/onboarding/use-auto-advance';
import { useStationLayout } from '@/features/onboarding/use-station-scale';
import { usePreferences } from '@/features/preferences/preferences';
import { useFrame } from '@/theme/layout';

// Pictogrammes (taille de la maquette) : pied 23 × 31, vélo 28 × 24, voiture 25 × 22.
const ICONS = {
  pied: { Icon: Walk, width: 23.07, height: 30.705 },
  velo: { Icon: Bike, width: 28, height: 23.917 },
  voiture: { Icon: Car, width: 25.23, height: 22.203 },
} as const;

/** 04 Transport */
export default function Transport() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { preferences, update } = usePreferences();
  const advance = useAutoAdvance();
  const { top, scale } = useStationLayout();
  const [picked, setPicked] = useState<TransportMode | undefined>(preferences.transport);

  const [first, second, third] = TRANSPORT_MODES.map((mode): StationOption<TransportMode> => {
    const { Icon, width, height } = ICONS[mode];
    return { value: mode, label: t(`transport.modes.${mode}`), content: <Icon width={width * scale} height={height * scale} /> };
  });
  if (!first || !second || !third) return null;

  return (
    <Screen decor="transport">
      <BackButton />
      <Stepper step={3} total={ONBOARDING_STEPS} />
      <View style={[styles.heading, { top: frame.top(138) }]}>
        <Title>{t('transport.title')}</Title>
        <Subtitle style={styles.subtitle}>{t('transport.subtitle')}</Subtitle>
      </View>
      <StationPicker
        options={[first, second, third]}
        selected={picked}
        scale={scale}
        top={top}
        onPick={(transport) => {
          setPicked(transport);
          update({ transport });
          advance(() => router.push('/experience'));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    position: 'absolute',
    left: 32,
    right: 32,
    gap: 11,
  },
  subtitle: {
    lineHeight: 16 * 1.2,
  },
});
