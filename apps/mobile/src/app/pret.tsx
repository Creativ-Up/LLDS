import {
  downloadSizeBytes,
  estimateDurationMin,
  pickText,
  speedKmh,
  type ExperienceType,
  type Lang,
  type Media,
  type StopMediaKind,
} from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OliveCta } from '@/components/buttons';
import { BackButton, ONBOARDING_STEPS, Stepper } from '@/components/chrome';
import { ClockIcon, DownloadIcon } from '@/components/icons';
import { Screen } from '@/components/screen';
import { Label } from '@/components/typography';
import { useAuth } from '@/features/auth/auth';
import { useLine, useLineStops, useMediaByIds, useSettings, useStopMedia } from '@/features/content/queries';
import { usePreferences } from '@/features/preferences/preferences';
import { formatDuration, formatKm, formatMegabytes } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, interFamily, radius, stroke } from '@/theme';
import { useFrame } from '@/theme/layout';

const CONTENT_WIDTH = 328;

/**
 * Taille réelle du téléchargement selon le type d'expérience : images de l'arrêt et narration
 * dans la langue choisie (à défaut en français, langue de référence des contenus).
 */
function useDownloadSize(lineId: string | undefined, coverId: string | null | undefined, experience: ExperienceType, lang: Lang) {
  const stops = useLineStops(lineId);
  const stopIds = (stops.data ?? []).map((stop) => stop.id);
  const stopMedia = useStopMedia(stopIds);
  const narrationOf = (stopId: string) => {
    const rows = (stopMedia.data ?? []).filter((row) => row.stop_id === stopId);
    const inLang = rows.filter((row) => row.lang === lang);
    return inLang.length > 0 ? inLang : rows.filter((row) => row.lang === 'fr');
  };
  const narrations = stopIds.flatMap(narrationOf);
  const media = useMediaByIds([
    coverId,
    ...(stops.data ?? []).flatMap((stop) => [stop.archive_media_id, stop.present_media_id]),
    ...narrations.map((row) => row.media_id),
  ]);
  if (!stops.data || !media.data) return null;
  const size = (id: string | null) => (id ? (media.data.get(id)?.size_bytes ?? 0) : 0);
  const perStop = stops.data.map((stop) => {
    const narration: Partial<Record<StopMediaKind, number>> = {};
    for (const row of narrationOf(stop.id)) {
      const file: Media | undefined = media.data.get(row.media_id);
      if (file) narration[row.kind] = file.size_bytes;
    }
    return { archiveBytes: size(stop.archive_media_id), presentBytes: size(stop.present_media_id), narration };
  });
  return downloadSizeBytes(size(coverId ?? null), perStop, experience);
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Label>{label}</Label>
      <Text numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

/** 06 Prêt pour le départ */
export default function Ready() {
  const router = useRouter();
  const frame = useFrame();
  const { t } = useTranslation();
  const { session } = useAuth();
  const { preferences, lang, transport, experience, direction, update } = usePreferences();
  const line = useLine(preferences.lineId);
  const settings = useSettings();
  const sizeBytes = useDownloadSize(line?.id, line?.cover_media_id, experience, lang);
  const [starting, setStarting] = useState(false);

  const duration =
    line?.length_m != null && settings.data
      ? formatDuration(t, estimateDurationMin(line.length_m, speedKmh(settings.data, transport)))
      : null;
  const size = sizeBytes === null ? null : formatMegabytes(t, lang, sizeBytes);

  async function start() {
    if (!line) return;
    setStarting(true);
    if (session) {
      // Ligne en cours (sens choisi) : la progression est conservée côté serveur pour les comptes.
      await supabase
        .from('line_progress')
        .upsert({ user_id: session.user.id, line_id: line.id, direction }, { onConflict: 'user_id,line_id' });
    }
    update({ onboarded: true });
    setStarting(false);
    router.replace('/carte');
  }

  // Aucune ligne choisie (ouverture directe de l'écran) : retour au choix de ligne.
  if (!preferences.lineId) return <Redirect href="/lignes" />;

  return (
    <Screen decor="ready">
      <BackButton />
      <Stepper step={ONBOARDING_STEPS} total={ONBOARDING_STEPS} />
      <Text accessibilityRole="header" style={[styles.title, { top: frame.top(150) }]}>
        {t('ready.title')}
      </Text>

      <View style={[styles.summary, { top: frame.top(224) }]}>
        <SummaryRow label={t('ready.language')} value={t(`lang.${lang}`, { ns: 'common' })} />
        <SummaryRow
          label={t('ready.line')}
          value={line ? t('ready.lineValue', { code: line.code, name: pickText(line.name, lang) }) : ''}
        />
        <SummaryRow label={t('ready.transport')} value={t(`transport.modes.${transport}`)} />
        <SummaryRow label={t('ready.experience')} value={t(`experience.labels.${experience}`)} last />
      </View>

      {/* Encart (y 500), téléchargement (y 586) et départ (y 700) s'enchaînent : un encart plus
          long (traduction, grand texte) repousse la suite au lieu de passer dessous. */}
      <View style={[styles.column, { top: frame.top(500) }]}>
        <View style={styles.encartSlot}>
          {line && (
            <View style={styles.encart}>
              <ClockIcon />
              <Text style={styles.encartText}>
                {[
                  t('ready.summary', {
                    stops: t('ready.stops', { count: line.stop_count }),
                    distance: line.length_m !== null ? formatKm(t, lang, line.length_m) : '',
                    duration: duration ?? '',
                    mode: t(`transport.modesInline.${transport}`),
                  }),
                  t('ready.stamps', { count: line.stamp_count }),
                ].join('\n')}
              </Text>
            </View>
          )}
        </View>

          <View style={styles.download}>
          <View style={styles.downloadText}>
            <Text numberOfLines={1} style={styles.downloadTitle}>
              {t('ready.download')}
            </Text>
            <Text numberOfLines={1} style={styles.downloadSize}>
              {size ? t('ready.downloadSize', { size }) : ' '}
            </Text>
          </View>
          {/* Téléchargement hors ligne : jalon M5. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('a11y.download')}
            accessibilityState={{ disabled: true }}
            disabled
            style={styles.downloadButton}
          >
            <DownloadIcon />
          </Pressable>
        </View>

        <OliveCta label={t('ready.start')} onPress={start} disabled={!line || starting} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    position: 'absolute',
    left: 32,
    right: 32,
    fontFamily: interFamily(600),
    fontSize: 34,
    lineHeight: 34 * 1.1,
    letterSpacing: letterSpacingPt(-0.025, 34),
    color: colors.ink,
  },
  summary: {
    position: 'absolute',
    left: 31,
    width: CONTENT_WIDTH,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 17,
    paddingHorizontal: 4,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.tilleul,
  },
  rowValue: {
    flexShrink: 1,
    fontFamily: interFamily(500),
    fontSize: 16,
    lineHeight: 16,
    color: colors.ink,
  },
  column: {
    position: 'absolute',
    left: 31,
    width: CONTENT_WIDTH,
  },
  // Encart 66 pt + écart 20 = carte de téléchargement en y 586.
  encartSlot: {
    minHeight: 66,
    marginBottom: 20,
  },
  encart: {
    minHeight: 66,
    borderRadius: radius.card,
    backgroundColor: colors.tilleulLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  encartText: {
    flex: 1,
    fontFamily: interFamily(400),
    fontSize: 14.5,
    lineHeight: 14.5 * 1.3,
    color: colors.oliveText,
  },
  // Carte 92 pt + écart 22 = départ en y 700.
  download: {
    height: 92,
    marginBottom: 22,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: radius.card,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
    backgroundColor: colors.cream,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  downloadText: {
    flex: 1,
    gap: 4,
  },
  downloadTitle: {
    fontFamily: interFamily(600),
    fontSize: 15,
    lineHeight: 15 * 1.2,
    color: colors.ink,
  },
  downloadSize: {
    fontFamily: interFamily(400),
    fontSize: 13,
    lineHeight: 13 * 1.3,
    color: colors.olive,
  },
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
