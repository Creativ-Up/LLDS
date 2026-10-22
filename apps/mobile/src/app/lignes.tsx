import { pickText, type LineOverview, type Media } from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { ArchiveImage } from '@/components/archive-image';
import { TextLink } from '@/components/buttons';
import { BackButton, ONBOARDING_STEPS, Stepper } from '@/components/chrome';
import { TicketFrame } from '@/components/decor';
import { GuestIcon, PinIcon, ScrollHint } from '@/components/icons';
import { Screen } from '@/components/screen';
import { useLines, useMediaByIds, useMediaUrl } from '@/features/content/queries';
import { nearestPublishedLine, useCurrentLocation } from '@/features/content/use-nearby';
import { useAutoAdvance } from '@/features/onboarding/use-auto-advance';
import { usePreferences } from '@/features/preferences/preferences';
import { formatDistance, formatKm } from '@/lib/format';
import { colors, interFamily, radius } from '@/theme';
import { useFrame } from '@/theme/layout';

// Cadres « billet perforé » de la maquette (tirets irréguliers et repères rouges), répétés en cycle.
const TICKETS = [
  { dash: '150 12 58 12 190 12 70 12', offset: 0, mark: '»', markX: 96 },
  { dash: '210 14 46 14 120 14 180 14', offset: -60, mark: '▸▸', markX: 150 },
  { dash: '60 14 250 14 120 14 90 14', offset: -30, mark: '»', markX: -4 },
  { dash: '240 14 100 14 70 14 160 14', offset: -120, mark: '▸▸', markX: 230 },
  { dash: '170 14 120 14 190 14 80 14', offset: -200, mark: '»', markX: 120 },
] as const;

const LIST_TOP = 265;
const LIST_GAP = 18;
const TICKET_WIDTH = 328;
const HEIGHT = { suggested: 90, regular: 74 } as const;
const PICK_DELAY_MS = 260;

function useBlink() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.25, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1);
  }, [opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function LineTicket({
  line,
  index,
  cover,
  suggested,
  onPick,
}: {
  line: LineOverview;
  index: number;
  cover: Media | undefined;
  suggested: boolean;
  onPick: () => void;
}) {
  const { t } = useTranslation();
  const { lang } = usePreferences();
  const url = useMediaUrl(cover);
  const ticket = TICKETS[index % TICKETS.length] ?? TICKETS[0];
  const comingSoon = line.status === 'coming_soon';
  const height = suggested ? HEIGHT.suggested : HEIGHT.regular;
  const tone = comingSoon ? colors.greyDisabled : colors.ink;
  const name = pickText(line.name, lang);
  const meta = [
    line.length_m !== null ? formatKm(t, lang, line.length_m, true) : null,
    line.stop_count > 0 ? t('lines.stops', { count: line.stop_count }) : null,
    pickText(line.tagline, lang) || null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(t('lines.metaSeparator'));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: comingSoon }}
      accessibilityLabel={comingSoon ? t('a11y.comingSoon', { line: `${line.code} ${name}` }) : `${line.code} ${name}`}
      disabled={comingSoon}
      onPress={onPick}
      style={({ pressed }) => [styles.ticket, { height, opacity: pressed ? 0.85 : 1 }]}
    >
      <TicketFrame
        width={TICKET_WIDTH}
        height={height}
        color={suggested ? colors.olive : tone}
        dash={ticket.dash}
        dashOffset={ticket.offset}
      />
      <View style={styles.thumbFrame}>
        <ArchiveImage uri={url} width={72} height={50} />
      </View>
      <View style={styles.ticketText}>
        <View style={styles.ticketTitle}>
          <Text style={[styles.code, { color: tone }]}>{line.code}</Text>
          <Text numberOfLines={1} style={[styles.name, { color: tone }]}>
            {name}
          </Text>
        </View>
        <Text style={[styles.meta, { color: tone }]}>{meta}</Text>
      </View>
      {suggested && (
        <View style={styles.suggested}>
          <Text style={styles.suggestedText}>{t('lines.suggested')}</Text>
        </View>
      )}
      <Text style={[styles.mark, { left: ticket.markX }]}>{ticket.mark}</Text>
    </Pressable>
  );
}

/** 03 Choix de ligne (défilant) */
export default function Lines() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { preferences, lang, update } = usePreferences();
  const advance = useAutoAdvance();
  const blink = useBlink();
  const lines = useLines();
  const location = useCurrentLocation();
  const covers = useMediaByIds((lines.data ?? []).map((line) => line.cover_media_id));

  const list = lines.data ?? [];
  const nearest = nearestPublishedLine(list, location);
  const guest = preferences.guest === true;

  // Billets empilés : la ligne suggérée (la plus proche) est plus haute.
  const positioned = list.reduce<{ line: LineOverview; index: number; suggested: boolean; top: number }[]>((acc, line, index) => {
    const previous = acc.at(-1);
    const top = previous ? previous.top + (previous.suggested ? HEIGHT.suggested : HEIGHT.regular) + LIST_GAP : LIST_TOP;
    return [...acc, { line, index, suggested: nearest?.line.id === line.id, top }];
  }, []);
  const last = positioned.at(-1);
  const listEnd = last ? last.top + (last.suggested ? HEIGHT.suggested : HEIGHT.regular) : LIST_TOP;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: frame.insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: frame.top(listEnd) + (guest ? 160 : 110) }}>
          <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 390 ${listEnd + 280}`} opacity={0.5} pointerEvents="none">
            <Path d="M 420 560 C 300 640 180 790 130 990" stroke={colors.rose} strokeWidth={1.4} fill="none" opacity={0.6} />
            <Path d="M 470 620 C 340 700 230 850 190 1000" stroke={colors.rose} strokeWidth={1.4} fill="none" opacity={0.6} />
          </Svg>
          <Stepper step={2} total={ONBOARDING_STEPS} />
          <Text accessibilityRole="header" style={[styles.title, { top: frame.top(150) }]}>
            {t('lines.title')}
          </Text>

          {location.status === 'denied' ? (
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                const permission = await Location.getForegroundPermissionsAsync();
                if (permission.canAskAgain) router.push('/autorisations');
                else void Linking.openSettings();
              }}
              style={({ pressed }) => [
                styles.banner,
                styles.bannerOff,
                { top: frame.top(205), backgroundColor: pressed ? colors.pressTilleul : 'transparent' },
              ]}
            >
              <PinIcon crossed />
              <Text style={styles.bannerOffText}>{t('lines.locationOff')}</Text>
              <Text style={styles.enable}>{t('lines.enable')}</Text>
            </Pressable>
          ) : nearest ? (
            <View style={[styles.banner, styles.bannerOn, { top: frame.top(205) }]}>
              <PinIcon />
              <Text style={styles.bannerText}>
                <Trans
                  t={t}
                  i18nKey="lines.nearby"
                  values={{ code: nearest.line.code, distance: formatDistance(t, lang, nearest.meters) }}
                  components={{ b: <Text style={styles.bannerStrong} /> }}
                />
              </Text>
            </View>
          ) : null}

          {lines.isPending && <ActivityIndicator color={colors.olive} style={{ position: 'absolute', top: frame.top(LIST_TOP), alignSelf: 'center' }} />}
          {lines.isError && (
            <View style={[styles.state, { top: frame.top(LIST_TOP) }]}>
              <Text style={styles.stateText}>{t('lines.loadError')}</Text>
              <TextLink onPress={() => void lines.refetch()} color={colors.red}>
                {t('errors.retry')}
              </TextLink>
            </View>
          )}
          {lines.isSuccess && list.length === 0 && (
            <Text style={[styles.state, styles.stateText, { top: frame.top(LIST_TOP) }]}>{t('lines.empty')}</Text>
          )}

          {positioned.map(({ line, index, suggested, top }) => (
            <View key={line.id} style={[styles.ticketSlot, { top: frame.top(top) }]}>
              <LineTicket
                line={line}
                index={index}
                suggested={suggested}
                cover={line.cover_media_id ? covers.data?.get(line.cover_media_id) : undefined}
                onPick={() => {
                  update({ lineId: line.id });
                  advance(() => router.push({ pathname: '/ligne/[id]', params: { id: line.id } }), PICK_DELAY_MS);
                }}
              />
            </View>
          ))}

          {guest ? (
            <View style={[styles.guest, { top: frame.top(listEnd + 25) }]}>
              <View style={styles.guestTitleRow}>
                <GuestIcon />
                <Text style={styles.guestTitle}>{t('lines.guestTitle')}</Text>
              </View>
              <Text style={styles.guestText}>{t('lines.guestText')}</Text>
              <TextLink onPress={() => router.push('/inscription')} color={colors.red} size={14} weight={500} style={styles.guestCta}>
                {t('lines.guestCta')}
              </TextLink>
            </View>
          ) : (
            list.length > 3 && (
              <Animated.View
                accessible
                accessibilityLabel={t('a11y.scrollHint')}
                style={[styles.scrollHint, { top: frame.top(listEnd + 67) }, blink]}
              >
                <ScrollHint />
              </Animated.View>
            )
          )}
        </View>
      </ScrollView>
      <BackButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    position: 'absolute',
    left: 32,
    fontFamily: interFamily(600),
    fontSize: 34,
    lineHeight: 34 * 1.1,
    letterSpacing: letterSpacingPt(-0.025, 34),
    color: colors.ink,
  },
  banner: {
    position: 'absolute',
    left: 31,
    width: TICKET_WIDTH,
    height: 48,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  bannerOn: {
    backgroundColor: colors.tilleulLight,
  },
  bannerOff: {
    borderWidth: 2,
    borderColor: colors.tilleul,
  },
  bannerText: {
    flex: 1,
    fontFamily: interFamily(400),
    fontSize: 15,
    color: colors.ink,
  },
  bannerStrong: {
    fontFamily: interFamily(700),
  },
  bannerOffText: {
    flex: 1,
    fontFamily: interFamily(400),
    fontSize: 14.5,
    color: colors.ink,
  },
  enable: {
    fontFamily: interFamily(500),
    fontSize: 14,
    color: colors.red,
    textDecorationLine: 'underline',
  },
  ticketSlot: {
    position: 'absolute',
    left: 31,
    width: TICKET_WIDTH,
  },
  ticket: {
    width: TICKET_WIDTH,
  },
  thumbFrame: {
    position: 'absolute',
    left: 12,
    top: 10,
    width: 76,
    height: 54,
    borderWidth: 2,
    borderColor: colors.tilleul,
    overflow: 'hidden',
  },
  ticketText: {
    position: 'absolute',
    left: 100,
    top: 11,
    right: 14,
    gap: 3,
  },
  ticketTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  code: {
    fontFamily: interFamily(700),
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: letterSpacingPt(-0.02, 20),
  },
  name: {
    flexShrink: 1,
    fontFamily: interFamily(500, true),
    fontSize: 14,
    lineHeight: 16,
  },
  meta: {
    fontFamily: interFamily(400),
    fontSize: 12.5,
    lineHeight: 15,
  },
  suggested: {
    position: 'absolute',
    right: 14,
    bottom: 11,
    height: 26,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.tilleulLight,
    justifyContent: 'center',
  },
  suggestedText: {
    fontFamily: interFamily(400),
    fontSize: 12.5,
    color: colors.oliveText,
  },
  mark: {
    position: 'absolute',
    bottom: -9,
    fontFamily: interFamily(700),
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: letterSpacingPt(0.06, 11),
    color: colors.red,
  },
  state: {
    position: 'absolute',
    left: 32,
    right: 32,
    alignItems: 'flex-start',
    gap: 10,
  },
  stateText: {
    fontFamily: interFamily(400),
    fontSize: 15,
    lineHeight: 15 * 1.4,
    color: colors.ink,
  },
  guest: {
    position: 'absolute',
    left: 31,
    width: TICKET_WIDTH,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.red,
    backgroundColor: colors.cream,
    gap: 10,
  },
  guestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guestTitle: {
    fontFamily: interFamily(600),
    fontSize: 15,
    color: colors.ink,
  },
  guestText: {
    fontFamily: interFamily(400),
    fontSize: 13.5,
    lineHeight: 13.5 * 1.4,
    color: colors.ink,
  },
  guestCta: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  scrollHint: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
