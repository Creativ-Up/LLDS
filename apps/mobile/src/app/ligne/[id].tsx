import { estimateDurationMin, pickText, type LineDirection, type StopOverview } from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ArchiveImage } from '@/components/archive-image';
import { OliveCta, TextLink } from '@/components/buttons';
import { BackButton, ONBOARDING_STEPS, Stepper } from '@/components/chrome';
import { LinePlan } from '@/components/line-plan';
import { Screen } from '@/components/screen';
import { StampMark } from '@/components/stamp-mark';
import { Label } from '@/components/typography';
import { useAuth } from '@/features/auth/auth';
import {
  useLine,
  useLineProgress,
  useLineStamps,
  useLineStops,
  useMediaByIds,
  useMediaUrl,
  useSettings,
} from '@/features/content/queries';
import { usePreferences } from '@/features/preferences/preferences';
import { formatDuration, formatKm } from '@/lib/format';
import { colors, interFamily, radius, stroke } from '@/theme';
import { useFrame } from '@/theme/layout';

const CONTENT_WIDTH = 328;

/** Extrémités de la ligne : « Bassilly - Renaix » → [Bassilly, Renaix], sinon premier et dernier arrêts. */
function lineEnds(name: string, stops: StopOverview[], lang: Parameters<typeof pickText>[1]): [string, string] {
  const parts = name.split(' - ').map((part) => part.trim());
  const [from, to] = parts;
  if (parts.length === 2 && from && to) return [from, to];
  const first = stops.at(0);
  const last = stops.at(-1);
  return [first ? pickText(first.name, lang) : '', last ? pickText(last.name, lang) : ''];
}

/** 03b Détail de ligne : sens, plan, état (nouvelle / en cours / terminée). */
export default function LineDetail() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, direction, update } = usePreferences();
  const { session } = useAuth();
  const line = useLine(id);
  const stops = useLineStops(id);
  const stamps = useLineStamps(id);
  const settings = useSettings();
  const progress = useLineProgress(session ? id : undefined);
  const stampWithImage = (stamps.data ?? []).find((stamp) => stamp.image_media_id);
  const media = useMediaByIds([line?.cover_media_id, stampWithImage?.image_media_id]);
  const coverUrl = useMediaUrl(line?.cover_media_id ? media.data?.get(line.cover_media_id) : undefined);

  if (!line || !stops.data) {
    return (
      <Screen>
        <ActivityIndicator color={colors.olive} style={styles.loading} />
        <BackButton />
      </Screen>
    );
  }

  const name = pickText(line.name, lang);
  const reversed = direction === 'backward';
  const ordered = reversed ? [...stops.data].reverse() : stops.data;
  const [start, end] = lineEnds(name, stops.data, lang);
  const [from, to] = reversed ? [end, start] : [start, end];

  const summary = progress.data;
  const visitedCount = summary ? ordered.filter((stop) => summary.visitedStopIds.has(stop.id)).length : 0;
  const status = summary?.status === 'completed' ? 'completed' : visitedCount > 0 || summary?.status === 'in_progress' ? 'in_progress' : 'new';
  const next = ordered.find((stop) => !summary?.visitedStopIds.has(stop.id));
  const nextName = next ? pickText(next.name, lang) : '';
  const stampsObtained = (stamps.data ?? []).filter((stamp) => summary?.stampIds.has(stamp.id)).length;

  const meta = [
    line.length_m !== null ? formatKm(t, lang, line.length_m, true) : null,
    t('lines.stops', { count: line.stop_count }),
    pickText(line.tagline, lang) || null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(t('lines.metaSeparator'));

  const durations =
    line.length_m !== null && settings.data
      ? {
          walk: formatDuration(t, estimateDurationMin(line.length_m, settings.data.walk_kmh)),
          bike: formatDuration(t, estimateDurationMin(line.length_m, settings.data.bike_kmh)),
        }
      : null;

  const chooseLine = () => {
    update({ lineId: line.id, direction });
    router.push('/transport');
  };

  const state =
    status === 'in_progress'
      ? {
          title: t('lineDetail.progressTitle', { done: visitedCount, total: line.stop_count }),
          sub: t('lineDetail.progressSub', {
            points: summary?.points ?? 0,
            count: stampsObtained,
            stampsTotal: line.stamp_count,
            next: nextName,
          }),
          cta: t('lineDetail.resume', { stop: nextName.toUpperCase() }),
          onCta: () => router.replace('/carte'),
          link: { label: t('lineDetail.restart'), onPress: chooseLine },
        }
      : status === 'completed'
        ? {
            title: t('lineDetail.doneTitle', { total: line.stop_count }),
            sub: t('lineDetail.doneSub', { points: summary?.points ?? 0, count: line.stamp_count }),
            cta: t('lineDetail.review'),
            onCta: () => router.replace('/carte'),
            link: null,
          }
        : {
            title: t('lineDetail.newTitle', { count: line.stamp_count }),
            sub: durations ? t('lineDetail.newSub', durations) : null,
            cta: t('lineDetail.choose'),
            onCta: chooseLine,
            link: null,
          };

  const setDirection = (value: LineDirection) => update({ direction: value });

  return (
    <Screen>
      <BackButton />
      <Stepper step={2} total={ONBOARDING_STEPS} />
      <View style={[styles.header, { top: frame.top(138) }]}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.code}>
            {line.code}
          </Text>
          <Text numberOfLines={1} style={styles.name}>
            {name}
          </Text>
        </View>
        <Text style={styles.meta}>{meta}</Text>
      </View>

      <View style={[styles.cover, { top: frame.top(214) }]}>
        <ArchiveImage uri={coverUrl} width={CONTENT_WIDTH - 4} height={146} />
      </View>

      <View style={[styles.directionBlock, { top: frame.top(388) }]}>
        <Label>{t('lineDetail.direction')}</Label>
        <View accessibilityRole="radiogroup" style={styles.segmented}>
          {(['forward', 'backward'] as const).map((value) => {
            const active = direction === value;
            const [a, b] = value === 'forward' ? [start, end] : [end, start];
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setDirection(value)}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text numberOfLines={1} style={[styles.optionText, { color: active ? colors.cream : colors.olive }]}>
                  {t('lineDetail.directionOption', { from: a, to: b })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.plan, { top: frame.top(478) }]}>
        <LinePlan
          width={CONTENT_WIDTH}
          count={ordered.length}
          visited={visitedCount}
          fromLabel={from}
          toLabel={to}
          currentLabel={status === 'in_progress' ? nextName : undefined}
        />
      </View>

      <View style={[styles.status, { top: frame.top(556) }]}>
        <StampMark
          image={stampWithImage?.image_media_id ? media.data?.get(stampWithImage.image_media_id) : null}
          size={40}
          style={{ opacity: status === 'new' ? 0.35 : 1 }}
        />
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>{state.title}</Text>
          {state.sub && <Text style={styles.statusSub}>{state.sub}</Text>}
        </View>
      </View>

      <View style={[styles.actions, { bottom: frame.bottom(34) }]}>
        <OliveCta label={state.cta} onPress={state.onCta} />
        {state.link && <TextLink onPress={state.link.onPress}>{state.link.label}</TextLink>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 200,
  },
  header: {
    position: 'absolute',
    left: 32,
    right: 32,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  code: {
    fontFamily: interFamily(700),
    fontSize: 34,
    lineHeight: 34 * 1.1,
    letterSpacing: letterSpacingPt(-0.025, 34),
    color: colors.ink,
  },
  name: {
    flexShrink: 1,
    fontFamily: interFamily(500, true),
    fontSize: 20,
    lineHeight: 22,
    color: colors.ink,
  },
  meta: {
    fontFamily: interFamily(400),
    fontSize: 14,
    lineHeight: 14 * 1.3,
    color: colors.olive,
  },
  cover: {
    position: 'absolute',
    left: 31,
    width: CONTENT_WIDTH,
    height: 150,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
    overflow: 'hidden',
  },
  directionBlock: {
    position: 'absolute',
    left: 31,
    width: CONTENT_WIDTH,
    gap: 10,
  },
  segmented: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: radius.button,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
  },
  option: {
    flex: 1,
    height: 38,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  optionActive: {
    backgroundColor: colors.olive,
  },
  optionText: {
    fontFamily: interFamily(500),
    fontSize: 13.5,
  },
  plan: {
    position: 'absolute',
    left: 31,
    width: CONTENT_WIDTH,
  },
  status: {
    position: 'absolute',
    left: 31,
    width: CONTENT_WIDTH,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.card,
    backgroundColor: colors.tilleulLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusText: {
    flex: 1,
    gap: 4,
  },
  statusTitle: {
    fontFamily: interFamily(600),
    fontSize: 15,
    lineHeight: 15 * 1.25,
    color: colors.ink,
  },
  statusSub: {
    fontFamily: interFamily(400),
    fontSize: 13.5,
    lineHeight: 13.5 * 1.3,
    color: colors.oliveText,
  },
  actions: {
    position: 'absolute',
    left: 31,
    right: 31,
    gap: 18,
  },
});
