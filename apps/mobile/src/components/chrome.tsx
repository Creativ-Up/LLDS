import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { colors, stroke } from '@/theme';
import { useFrame } from '@/theme/layout';

import { ChevronLeft } from './icons';

/** Bouton retour : cercle 44 en (31, 68), contour 2 pt rouge, chevron ; appui `redTint`. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('a11y.back')}
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [
        styles.back,
        { top: frame.top(68), backgroundColor: pressed ? colors.redTint : 'transparent' },
      ]}
    >
      <ChevronLeft />
    </Pressable>
  );
}

const STEPPER = { width: 260, height: 12, start: 6, end: 252 } as const;

/**
 * Stepper d'onboarding en (94, 86) : ligne 2 pt rose, pastille faite r 5,5 rouge,
 * à venir r 5 crème contour 1,6 rose. Nombre de pastilles = nombre d'étapes.
 */
export function Stepper({ step, total }: { step: number; total: number }) {
  const frame = useFrame();
  const { t } = useTranslation();
  const gap = (STEPPER.end - STEPPER.start) / Math.max(total - 1, 1);
  return (
    <View
      accessible
      accessibilityLabel={t('a11y.step', { step, total })}
      style={[styles.stepper, { top: frame.top(86) }]}
    >
      <Svg width={STEPPER.width} height={STEPPER.height} viewBox={`0 0 ${STEPPER.width} ${STEPPER.height}`}>
        <Line x1={6} y1={6} x2={254} y2={6} stroke={colors.rose} strokeWidth={2} />
        {Array.from({ length: total }, (_, index) => {
          const cx = STEPPER.start + index * gap;
          return index < step ? (
            <Circle key={index} cx={cx} cy={6} r={5.5} fill={colors.red} />
          ) : (
            <Circle key={index} cx={cx} cy={6} r={5} fill={colors.cream} stroke={colors.rose} strokeWidth={1.6} />
          );
        })}
      </Svg>
    </View>
  );
}

/** Étapes de l'onboarding (Langue, Ligne, Transport, Expérience, Prêt). */
export const ONBOARDING_STEPS = 5;

const styles = StyleSheet.create({
  back: {
    position: 'absolute',
    left: 31,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: stroke.control,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepper: {
    position: 'absolute',
    left: 94,
    width: STEPPER.width,
    height: STEPPER.height,
  },
});
