import {
  buildRoute,
  DEFAULT_LANG,
  langSchema,
  lineOverviewSchema,
  pickText,
  pointAlongLine,
  projectOnLine,
  speedKmh,
  type Lang,
  type LineOverview,
  type LngLat,
  type RouteStop,
} from '@llds/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { OutlineButton } from '@/components/buttons';
import { useLine, useLineStops, useSettings } from '@/features/content/queries';
import { setSimulation, startSimulatedTrip, useSimulation } from '@/features/map/simulation';
import { usePreferences } from '@/features/preferences/preferences';
import { supabaseUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { colors, interFamily, layout, radius, stroke, textStyle } from '@/theme';

// Menu développeur : vérifie la chaîne app → Supabase (lignes visibles du public), permet de rejouer
// l'onboarding et de simuler la position sur la ligne choisie. Route /dev (menu Expo du build de
// développement, ou appui long sur la pilule de ligne de la carte).

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; lines: LineOverview[] };

export default function DevScreen() {
  const { t, i18n } = useTranslation(['mobile', 'common']);
  const router = useRouter();
  const { reset } = usePreferences();
  const [state, setState] = useState<State>({ kind: 'loading' });

  async function resetApp() {
    await supabase.auth.signOut();
    reset();
    router.replace('/');
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.from('line_overview').select('*').order('sort_order');
      if (cancelled) return;
      if (error) {
        setState({ kind: 'error', message: error.message });
        return;
      }
      const parsed = z.array(lineOverviewSchema).safeParse(data);
      setState(parsed.success ? { kind: 'ready', lines: parsed.data } : { kind: 'error', message: parsed.error.message });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lang = langSchema.catch(DEFAULT_LANG).parse(i18n.language);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('dev.title')}</Text>

        <Text style={styles.label}>{t('dev.backend')}</Text>
        {state.kind === 'loading' && <ActivityIndicator color={colors.olive} />}
        {state.kind === 'error' && <Text style={styles.error}>{t('dev.backendError', { message: state.message })}</Text>}
        {state.kind === 'ready' && <Text style={styles.body}>{t('dev.backendOk', { url: supabaseUrl })}</Text>}

        <OutlineButton label={t('dev.reset')} onPress={() => void resetApp()} />
        <Text style={styles.hint}>{t('dev.resetHint')}</Text>

        <SimulationPanel lang={lang} />

        <Text style={styles.label}>{t('dev.lines')}</Text>
        {state.kind === 'ready' && state.lines.map((line) => <LineRow key={line.id} line={line} lang={lang} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Vitesses du trajet simulé, en multiples de la vitesse du mode de transport choisi. */
const TRIP_FACTORS = [10, 30, 100] as const;
/** « Approcher » : point du tracé situé à cette distance avant le rayon de l'arrêt. */
const APPROACH_M = 70;

function SimulationPanel({ lang }: { lang: Lang }) {
  const { t } = useTranslation(['mobile', 'common']);
  const router = useRouter();
  const { preferences, direction, transport } = usePreferences();
  const lineId = preferences.lineId;
  const line = useLine(lineId);
  const stops = useLineStops(lineId);
  const settings = useSettings();
  const simulation = useSimulation();
  const route =
    line?.track_geojson && stops.data ? buildRoute(line.track_geojson.coordinates, stops.data, direction) : null;

  const header = (
    <>
      <Text style={styles.label}>{t('dev.simulation.title')}</Text>
      <Text style={styles.body}>{simulation ? t('dev.simulation.simulated') : t('dev.simulation.real')}</Text>
      <Text style={styles.hint}>{t('dev.simulation.hint')}</Text>
    </>
  );
  if (!lineId || !route || !settings.data) {
    return (
      <>
        {header}
        <Text style={styles.hint}>{t('dev.simulation.noLine')}</Text>
      </>
    );
  }

  // Retour à la carte déjà ouverte (pas de nouvelle carte empilée, qui suivrait aussi la position).
  const toMap = () => router.dismissTo('/carte');
  const place = ([lng, lat]: LngLat) => {
    setSimulation({ kind: 'point', lineId, lng, lat });
    toMap();
  };
  const approach = ({ stop, along }: RouteStop) => {
    const distance = stop.geofence_radius_m + APPROACH_M;
    // Avant l'arrêt sur le tracé, ou après lui s'il est en début de ligne.
    const at = along >= distance ? along - distance : Math.min(route.length, along + distance);
    place(pointAlongLine(route.line, at, route.cumulative));
  };
  const travel = (factor: number) => {
    // Départ du point simulé courant s'il y en a un, sinon du début de la ligne.
    const startAlong =
      simulation?.kind === 'point' && simulation.lineId === lineId
        ? projectOnLine([simulation.lng, simulation.lat], route.line, route.cumulative).along
        : 0;
    const speedMps = (speedKmh(settings.data, transport) / 3.6) * factor;
    startSimulatedTrip({ lineId, direction, startAlong, speedMps });
    toMap();
  };

  return (
    <>
      {header}
      {route.stops.map((target) => (
        <View key={target.stop.id} style={styles.simRow}>
          <Text style={styles.simName} numberOfLines={1}>
            {target.index}. {pickText(target.stop.name, lang)}
          </Text>
          <SmallButton label={t('dev.simulation.approach')} onPress={() => approach(target)} />
          <SmallButton label={t('dev.simulation.enter')} onPress={() => place([target.stop.lng, target.stop.lat])} />
        </View>
      ))}
      <View style={styles.simRow}>
        <Text style={styles.simName}>{t('dev.simulation.trip')}</Text>
        {TRIP_FACTORS.map((factor) => (
          <SmallButton key={factor} label={t('dev.simulation.speed', { factor })} onPress={() => travel(factor)} />
        ))}
      </View>
      {simulation && <OutlineButton label={t('dev.simulation.stop')} onPress={() => setSimulation(null)} />}
    </>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.small, { backgroundColor: pressed ? colors.pressTilleul : colors.cream }]}
    >
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

function LineRow({ line, lang }: { line: LineOverview; lang: Lang }) {
  const { t } = useTranslation(['mobile', 'common']);
  const km = line.length_m === null ? null : new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(line.length_m / 1000);
  return (
    <View style={styles.row}>
      <Text style={styles.code}>
        {line.code} <Text style={styles.lineName}>{pickText(line.name, lang)}</Text>
      </Text>
      <Text style={styles.meta}>
        {t(`common:lineStatus.${line.status}`)} · {t('dev.lineStops', { count: line.stop_count })} ·{' '}
        {km === null ? t('dev.noTrack') : t('common:units.km', { value: km })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingHorizontal: layout.sideMargin,
    paddingBottom: 32,
    gap: 10,
  },
  title: {
    ...textStyle('screenTitle'),
    color: colors.ink,
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    ...textStyle('label'),
    color: colors.olive,
    marginTop: 12,
  },
  body: {
    ...textStyle('bodySmall'),
    color: colors.ink,
  },
  hint: {
    ...textStyle('bodySmall'),
    color: colors.olive,
  },
  error: {
    ...textStyle('bodySmall'),
    color: colors.redDeep,
    backgroundColor: colors.redTint,
    borderRadius: radius.field,
    padding: 12,
  },
  row: {
    borderWidth: stroke.control,
    borderColor: colors.ink,
    borderRadius: radius.ticket,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    minHeight: layout.minTouch,
  },
  code: {
    fontFamily: interFamily(700),
    fontSize: 20,
    color: colors.ink,
  },
  lineName: {
    fontFamily: interFamily(500, true),
    fontSize: 14,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simName: {
    flex: 1,
    ...textStyle('bodySmall'),
    color: colors.ink,
  },
  small: {
    minHeight: layout.minTouch,
    minWidth: layout.minTouch,
    paddingHorizontal: 10,
    borderRadius: radius.field,
    borderWidth: stroke.control,
    borderColor: colors.tilleul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallText: {
    fontFamily: interFamily(500),
    fontSize: 13,
    color: colors.olive,
  },
  meta: {
    fontFamily: interFamily(400),
    fontSize: 12.5,
    lineHeight: 15,
    color: colors.olive,
  },
});
