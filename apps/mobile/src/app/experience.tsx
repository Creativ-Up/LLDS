import AudioIcon from '@llds/assets/icons/experience-audio.svg';
import CompleteIcon from '@llds/assets/icons/experience-complete.svg';
import type { ExperienceType } from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BackButton, ONBOARDING_STEPS, Stepper } from '@/components/chrome';
import { TicketFrame } from '@/components/decor';
import { CrescentsMark, CrossMark, DiamondMark } from '@/components/icons';
import { Screen } from '@/components/screen';
import { Subtitle, Title } from '@/components/typography';
import { useAutoAdvance } from '@/features/onboarding/use-auto-advance';
import { usePreferences } from '@/features/preferences/preferences';
import { colors, interFamily } from '@/theme';
import { useFrame } from '@/theme/layout';
import { pop } from '@/theme/motion';

const CARD = { width: 328, height: 136 } as const;

interface ExperienceCardProps {
  title: string;
  text: string;
  icon: ReactNode;
  dash: string;
  dashOffset?: number;
  marks: ReactNode;
  selected: boolean;
  onPress: () => void;
}

/** Billet 328 × 136 : icône olive + titre 600 21, texte 400 14,5 ; halo de sélection. */
function ExperienceCard({ title, text, icon, dash, dashOffset, marks, selected, onPress }: ExperienceCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      {selected && <Animated.View entering={pop} pointerEvents="none" style={styles.halo} />}
      <TicketFrame width={CARD.width} height={CARD.height} color={colors.ink} dash={dash} dashOffset={dashOffset} />
      <View style={styles.cardTitleRow}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardText}>{text}</Text>
      {marks}
    </Pressable>
  );
}

/** 05 Type d'expérience */
export default function Experience() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { preferences, update } = usePreferences();
  const advance = useAutoAdvance();
  const [picked, setPicked] = useState<ExperienceType | undefined>(preferences.experience);

  const pick = (experience: ExperienceType) => {
    setPicked(experience);
    update({ experience });
    advance(() => router.push('/pret'));
  };

  return (
    <Screen decor="experience">
      <BackButton />
      <Stepper step={4} total={ONBOARDING_STEPS} />
      <View style={[styles.heading, { top: frame.top(138) }]}>
        <Title>{t('experience.title')}</Title>
        <Subtitle style={styles.subtitle}>{t('experience.subtitle')}</Subtitle>
      </View>
      <View style={[styles.slot, { top: frame.top(274) }]}>
        <ExperienceCard
          title={t('experience.complete')}
          text={t('experience.completeText')}
          icon={<CompleteIcon width={30} height={30} />}
          dash="30 12 46 14 250 14 170 14"
          marks={
            <View style={[styles.mark, { left: -3, top: 46 }]}>
              <CrossMark />
            </View>
          }
          selected={picked === 'complete'}
          onPress={() => pick('complete')}
        />
      </View>
      <View style={[styles.slot, { top: frame.top(428) }]}>
        <ExperienceCard
          title={t('experience.audio')}
          text={t('experience.audioText')}
          icon={<AudioIcon width={29} height={21.47} />}
          dash="210 14 40 14 60 14 190 14"
          dashOffset={-40}
          marks={
            <>
              <View style={[styles.mark, { left: 150, top: -9 }]}>
                <CrescentsMark />
              </View>
              <View style={[styles.mark, { right: -5, top: 52 }]}>
                <DiamondMark />
              </View>
            </>
          }
          selected={picked === 'audio'}
          onPress={() => pick('audio')}
        />
      </View>
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
  slot: {
    position: 'absolute',
    left: 31,
  },
  card: {
    width: CARD.width,
    height: CARD.height,
  },
  halo: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 21,
    borderWidth: 4,
    borderColor: colors.haloRedSoft,
  },
  cardTitleRow: {
    position: 'absolute',
    left: 50,
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardTitle: {
    fontFamily: interFamily(600),
    fontSize: 21,
    lineHeight: 21,
    letterSpacing: letterSpacingPt(-0.02, 21),
    color: colors.ink,
  },
  cardText: {
    position: 'absolute',
    left: 50,
    top: 62,
    // Maquette : 26. L'Inter statique est un peu plus large que la police variable du prototype :
    // marge réduite pour garder la coupure de lignes de la maquette.
    right: 16,
    fontFamily: interFamily(400),
    fontSize: 14.5,
    lineHeight: 14.5 * 1.38,
    color: colors.ink,
  },
  mark: {
    position: 'absolute',
  },
});
