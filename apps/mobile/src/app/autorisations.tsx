import { motion } from '@llds/shared/tokens';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { RedButton, TextLink } from '@/components/buttons';
import { BackButton } from '@/components/chrome';
import { Screen } from '@/components/screen';
import { Strong, Title } from '@/components/typography';
import { requestNotificationPermission } from '@/lib/notifications';
import { colors, interFamily } from '@/theme';
import { useFrame } from '@/theme/layout';
import { pop } from '@/theme/motion';

type Step = 'location' | 'notifications';

/** Demande « pendant l'utilisation » puis « toujours » (géofencing en arrière-plan), selon l'OS. */
async function requestLocation(): Promise<void> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return;
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch {
    // Expo Go et certains Android refusent la demande « toujours » : la localisation au premier plan suffit.
  }
}

async function requestNotifications(): Promise<void> {
  try {
    await requestNotificationPermission();
  } catch {
    // Indisponible sur ce support : les alertes resteront visibles dans l'application.
  }
}

/** Halo pulsé (position, arrivée) : échelle 1 → 1,9, opacité 0,55 → 0, 2,2 s en boucle. */
function PulseHalo() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: motion.pulse, easing: Easing.out(Easing.quad) }), -1);
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [{ scale: 1 + 0.9 * progress.value }],
  }));
  return <Animated.View style={[styles.pulse, style]} />;
}

const BUZZ_DELAY = 350;

/** Cloche qui vibre (`buzz`) deux fois, avec une vraie vibration (BEHAVIOR.md). */
function BuzzingBell() {
  const shift = useSharedValue(0);
  useEffect(() => {
    const shake = withSequence(
      withTiming(-5, { duration: 90 }),
      withTiming(5, { duration: 90 }),
      withTiming(-4, { duration: 90 }),
      withTiming(4, { duration: 90 }),
      withTiming(-2, { duration: 90 }),
      withTiming(0, { duration: 90 }),
    );
    shift.value = withDelay(BUZZ_DELAY, withSequence(shake, shake));
    const haptic = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, BUZZ_DELAY);
    return () => clearTimeout(haptic);
  }, [shift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));
  return (
    <Animated.View style={style}>
      <Svg width={46} height={52} viewBox="0 0 46 52" fill="none">
        <Path
          d="M23 4c-8.6 0-14 6.4-14 14.6v9.8L4 36.6h38l-5-8.2v-9.8C37 10.4 31.6 4 23 4Z"
          fill={colors.redTint}
          stroke={colors.red}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M17 42.5a6.2 6.2 0 0 0 12 0" stroke={colors.red} strokeWidth={3.4} strokeLinecap="round" />
        <Circle cx={38} cy={9} r={6} fill={colors.red} />
      </Svg>
    </Animated.View>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

/** 02b Autorisations (2 étapes) : localisation puis notifications, vraies demandes système. */
export default function Permissions() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('location');
  const [busy, setBusy] = useState(false);
  const isLocation = step === 'location';

  const next = () => (isLocation ? setStep('notifications') : router.replace('/lignes'));

  async function allow() {
    setBusy(true);
    if (isLocation) await requestLocation();
    else await requestNotifications();
    setBusy(false);
    next();
  }

  return (
    <Screen>
      <BackButton onPress={() => (isLocation ? router.back() : setStep('location'))} />
      <View style={[styles.indicator, { top: frame.top(82) }]}>
        <View style={[styles.pill, { backgroundColor: colors.red }]} />
        <View style={[styles.pill, { backgroundColor: isLocation ? colors.roseLight : colors.red }]} />
        <Text style={styles.indicatorText}>{t('permissions.stepCount', { step: isLocation ? 1 : 2 })}</Text>
      </View>

      <View style={[styles.illustration, { top: frame.top(160) }]}>
        <Svg width={150} height={150} viewBox="0 0 150 150" style={StyleSheet.absoluteFill}>
          <Circle
            cx={75}
            cy={75}
            r={71}
            fill="none"
            stroke={colors.red}
            strokeWidth={5}
            strokeDasharray="190 26 90 60 60 20"
            strokeLinecap="round"
          />
        </Svg>
        {isLocation ? (
          <Animated.View key="pin" entering={pop} style={styles.pin}>
            <PulseHalo />
            <Svg width={44} height={52} viewBox="0 0 16 19" fill="none">
              <Path
                d="M8 1.2c3.2 0 6 2.6 6 5.9 0 4.4-6 10.7-6 10.7S2 11.5 2 7.1C2 3.8 4.8 1.2 8 1.2Z"
                fill={colors.redTint}
                stroke={colors.red}
                strokeWidth={1.7}
              />
              <Circle cx={8} cy={7} r={2.2} fill={colors.red} />
            </Svg>
          </Animated.View>
        ) : (
          <Animated.View key="bell" entering={pop}>
            <BuzzingBell />
          </Animated.View>
        )}
      </View>

      <View key={step} style={[styles.texts, { top: frame.top(344) }]}>
        <Title>{isLocation ? t('permissions.locationTitle') : t('permissions.notificationsTitle')}</Title>
        <Text style={styles.text}>{isLocation ? t('permissions.locationText') : t('permissions.notificationsText')}</Text>
        <View style={styles.bullets}>
          {isLocation ? (
            <>
              <Bullet>
                <Trans t={t} i18nKey="permissions.locationBulletAlways" components={{ b: <Strong /> }} />
              </Bullet>
              <Bullet>{t('permissions.locationBulletPrivacy')}</Bullet>
            </>
          ) : (
            <>
              <Bullet>{t('permissions.notificationsBulletOne')}</Bullet>
              <Bullet>{t('permissions.notificationsBulletSettings')}</Bullet>
            </>
          )}
        </View>
      </View>

      <View style={[styles.actions, { bottom: frame.bottom(40) }]}>
        <RedButton
          label={isLocation ? t('permissions.locationCta') : t('permissions.notificationsCta')}
          onPress={allow}
          disabled={busy}
        />
        <TextLink onPress={next}>{t('permissions.later')}</TextLink>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    left: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    width: 28,
    height: 6,
    borderRadius: 999,
  },
  indicatorText: {
    marginLeft: 4,
    fontFamily: interFamily(500),
    fontSize: 13,
    color: colors.olive,
  },
  illustration: {
    position: 'absolute',
    left: 32,
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 44,
    height: 52,
  },
  pulse: {
    position: 'absolute',
    left: -16,
    top: -16,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.haloRedSoft,
  },
  texts: {
    position: 'absolute',
    left: 32,
    right: 32,
    gap: 14,
  },
  text: {
    fontFamily: interFamily(400),
    fontSize: 16,
    lineHeight: 16 * 1.45,
    color: colors.olive,
  },
  bullets: {
    marginTop: 10,
    gap: 12,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    width: 8,
    height: 8,
    marginTop: 7,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  bulletText: {
    flex: 1,
    fontFamily: interFamily(400),
    fontSize: 15,
    lineHeight: 15 * 1.45,
    color: colors.ink,
  },
  actions: {
    position: 'absolute',
    left: 31,
    right: 31,
    gap: 18,
  },
});
