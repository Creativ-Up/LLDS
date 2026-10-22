import ArrowIcon from '@llds/assets/icons/arrow-up.svg';
import MedalIcon from '@llds/assets/icons/medal.svg';
import WalkModeIcon from '@llds/assets/icons/mode-pied.svg';
import type { TransportMode } from '@llds/shared';
import * as Haptics from 'expo-haptics';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ArrivalPin, BikeModeIcon, CarModeIcon, CloseCross } from '@/components/icons';
import { colors, interFamily, motion, radius, stroke } from '@/theme';

/** Pilule de ligne (« L87 Bassilly - Renaix »). */
export function LinePill({ code, name, onLongPress }: { code: string; name: string; onLongPress?: () => void }) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={800} style={styles.linePill}>
      <Text style={styles.lineCode}>{code}</Text>
      <Text numberOfLines={1} style={styles.lineName}>
        {name}
      </Text>
    </Pressable>
  );
}

/** Bouton rond 39 pt, contour `tilleul` (zone tactile 44 pt). */
export function RoundButton({
  label,
  onPress,
  children,
  style,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={3}
      style={({ pressed }) => [styles.round, { backgroundColor: pressed ? colors.pressTilleul : colors.cream }, style]}
    >
      {children}
    </Pressable>
  );
}

/** Carte de progression (arrêts, points, cachets) ; ouvre la fiche de ligne. */
export function ProgressCard({ lines, label, onPress, style }: { lines: string[]; label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} · ${lines.join(', ')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.progress, { backgroundColor: pressed ? colors.pressTilleul : colors.cream }, style]}
    >
      {lines.map((line) => (
        <Text key={line} style={styles.progressText}>
          {line}
        </Text>
      ))}
      <View style={styles.medal}>
        <MedalIcon width={11.667} height={16.667} />
      </View>
    </Pressable>
  );
}

function ModeIcon({ mode }: { mode: TransportMode }) {
  if (mode === 'velo') return <BikeModeIcon />;
  if (mode === 'voiture') return <CarModeIcon />;
  return <WalkModeIcon width={12} height={12.586} />;
}

/** Consigne de guidage (bas de la carte). `arrow` : rotation de la flèche, en degrés (0 = tout droit). */
export function GuidanceBar({
  title,
  subtitle,
  distance,
  arrow,
  mode,
  style,
}: {
  title: string;
  subtitle: string | null;
  distance: string | null;
  arrow: number | null;
  mode: TransportMode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View accessibilityRole="summary" style={[styles.guidance, style]}>
      <View style={[styles.arrow, { opacity: arrow === null ? 0 : 1 }]}>
        {/* L'icône de la maquette pointe vers le bas : demi-tour pour « tout droit ». */}
        <View style={{ transform: [{ rotate: `${180 + (arrow ?? 0)}deg` }] }}>
          <ArrowIcon width={17.5} height={20.667} />
        </View>
      </View>
      <View style={styles.guidanceBody}>
        <View style={styles.modeIcon}>
          <ModeIcon mode={mode} />
        </View>
        <View style={styles.guidanceTexts}>
          <Text style={styles.guidanceTitle}>{title}</Text>
          {subtitle && <Text style={styles.guidanceSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {distance && <Text style={styles.guidanceDistance}>{distance}</Text>}
    </View>
  );
}

const BUZZ_DELAY = 500;
const dropEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

/** Bandeau d'arrivée : glissement depuis le haut (0,45 s), puis secousses avec vibration. */
export function ArrivalBanner({
  title,
  subtitle,
  onOpen,
  onDismiss,
  style,
}: {
  title: string;
  subtitle: string;
  onOpen: () => void;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const drop = useSharedValue(0);
  const shift = useSharedValue(0);
  const halo = useSharedValue(0);
  useEffect(() => {
    drop.value = withTiming(1, { duration: motion.drop, easing: dropEasing });
    const shake = withSequence(
      withTiming(-5, { duration: 75 }),
      withTiming(5, { duration: 75 }),
      withTiming(-4, { duration: 75 }),
      withTiming(4, { duration: 75 }),
      withTiming(-2, { duration: 75 }),
      withTiming(0, { duration: 125 }),
    );
    shift.value = withDelay(BUZZ_DELAY, withSequence(shake, shake));
    halo.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1);
    const haptic = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, BUZZ_DELAY);
    return () => clearTimeout(haptic);
  }, [drop, shift, halo]);

  const container = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [{ translateY: (drop.value - 1) * 120 }],
  }));
  const card = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));
  // Halo rouge à 35 % (maquette), animé par `pulse` (opacité 0,55 → 0).
  const pulse = useAnimatedStyle(() => ({
    opacity: 0.35 * 0.55 * (1 - halo.value),
    transform: [{ scale: 1 + 0.9 * halo.value }],
  }));

  return (
    <Animated.View style={[styles.arrival, container, style]}>
      <Animated.View style={card}>
        <Pressable accessibilityRole="button" accessibilityLiveRegion="assertive" onPress={onOpen} style={styles.arrivalCard}>
          <View style={styles.arrivalBadge}>
            <Animated.View style={[styles.arrivalHalo, pulse]} />
            <ArrivalPin />
          </View>
          <View style={styles.arrivalTexts}>
            <Text style={styles.arrivalTitle}>{title}</Text>
            <Text style={styles.arrivalSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.arrivalOpen}>
            <Text style={styles.arrivalOpenText}>{t('map.arrival.open')}</Text>
          </View>
        </Pressable>
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.dismiss')}
        onPress={onDismiss}
        hitSlop={9}
        style={styles.arrivalClose}
      >
        <CloseCross />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  linePill: {
    height: 39,
    flexShrink: 1,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
    backgroundColor: colors.cream,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineCode: {
    fontFamily: interFamily(700),
    fontSize: 12,
    color: colors.ink,
  },
  lineName: {
    flexShrink: 1,
    fontFamily: interFamily(400),
    fontSize: 12,
    color: colors.ink,
  },
  round: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    width: 123,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 5,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
  },
  progressText: {
    fontFamily: interFamily(400),
    fontSize: 12,
    lineHeight: 17,
    color: colors.olive,
  },
  medal: {
    position: 'absolute',
    right: 11,
    top: 9,
  },
  guidance: {
    height: 85,
    borderRadius: radius.field,
    backgroundColor: colors.olive,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 16,
  },
  arrow: {
    width: 21,
    alignItems: 'center',
  },
  guidanceBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeIcon: {
    alignSelf: 'flex-end',
    marginBottom: 3,
  },
  guidanceTexts: {
    flex: 1,
    minWidth: 0,
  },
  guidanceTitle: {
    fontFamily: interFamily(500),
    fontSize: 19,
    lineHeight: 19 * 1.2,
    color: colors.cream,
  },
  guidanceSubtitle: {
    marginTop: 3,
    fontFamily: interFamily(400),
    fontSize: 12.5,
    lineHeight: 12.5 * 1.25,
    color: colors.cream,
    opacity: 0.72,
  },
  guidanceDistance: {
    fontFamily: interFamily(400),
    fontSize: 16,
    color: colors.cream,
  },
  arrival: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  arrivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 16,
    borderRadius: 18,
    borderWidth: stroke.control,
    borderColor: colors.olive,
    backgroundColor: colors.cream,
    shadowColor: colors.ink,
    shadowOpacity: 0.22,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  arrivalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivalHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    backgroundColor: colors.red,
  },
  arrivalTexts: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  arrivalTitle: {
    fontFamily: interFamily(600),
    fontSize: 15,
    lineHeight: 15 * 1.2,
    color: colors.ink,
  },
  arrivalSubtitle: {
    fontFamily: interFamily(400),
    fontSize: 13,
    lineHeight: 13 * 1.25,
    color: colors.olive,
  },
  arrivalOpen: {
    height: 30,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: colors.olive,
    justifyContent: 'center',
  },
  arrivalOpenText: {
    fontFamily: interFamily(500),
    fontSize: 13,
    color: colors.cream,
  },
  arrivalClose: {
    position: 'absolute',
    right: -4,
    top: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.olive,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
