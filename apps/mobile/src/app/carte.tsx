import ProfileIcon from '@llds/assets/icons/profile.svg';
import {
  alongOnTrack,
  angleDelta,
  buildRoute,
  guidanceTo,
  haversineMeters,
  nextStop,
  pickText,
  travelledMeters,
  type RouteStop,
} from '@llds/shared';
import * as Notifications from 'expo-notifications';
import { Redirect, useIsFocused, useRouter } from 'expo-router';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GearIcon, StampsIcon } from '@/components/icons';
import { LineMap, type StopState } from '@/components/map/line-map';
import { ArrivalBanner, GuidanceBar, LinePill, ProgressCard, RoundButton } from '@/components/map/map-overlays';
import { LineSheet, PoiSheet, type PoiAction } from '@/components/map/sheets';
import { Screen } from '@/components/screen';
import { useAuth } from '@/features/auth/auth';
import {
  useLine,
  useLineProgress,
  useLineStamps,
  useLineStops,
  useMediaByIds,
  useOfferStops,
} from '@/features/content/queries';
import { watchStops } from '@/features/map/geofencing';
import { simulationFor, useSimulation } from '@/features/map/simulation';
import { useTracking } from '@/features/map/use-tracking';
import { usePreferences } from '@/features/preferences/preferences';
import { formatDistance } from '@/lib/format';
import { arrivalStopId } from '@/lib/notifications';
import { useFrame } from '@/theme/layout';

type Sheet = { kind: 'poi'; stopId: string } | { kind: 'line' } | null;

const NOTHING_VISITED: ReadonlySet<string> = new Set();

/** 07 Carte du parcours : tracé, arrêts, position, guidage vers le prochain arrêt, arrivées. */
export default function MapScreen() {
  const router = useRouter();
  const frame = useFrame();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { preferences, lang, transport, direction } = usePreferences();
  const { session } = useAuth();
  const focused = useIsFocused();
  const lineId = preferences.lineId;
  const guest = preferences.guest === true || !session;

  const line = useLine(lineId);
  const stops = useLineStops(lineId);
  const progress = useLineProgress(lineId);
  const lineStamps = useLineStamps(lineId);
  const stampMedia = useMediaByIds((lineStamps.data ?? []).map((stamp) => stamp.image_media_id));
  const offerStops = useOfferStops((stops.data ?? []).map((stop) => stop.id));
  const simulation = simulationFor(useSimulation(), lineId, direction);

  // Identité stable : le suivi de position et le géofencing ne se relancent que si le tracé change.
  const track = line?.track_geojson?.coordinates;
  const route = useMemo(
    () => (track && stops.data ? buildRoute(track, stops.data, direction) : null),
    [track, stops.data, direction],
  );
  const visited = progress.data?.visitedStopIds ?? NOTHING_VISITED;

  const [sheet, setSheet] = useState<Sheet>(null);
  const [arrival, setArrival] = useState<string | null>(null);
  // Notification d'arrivée touchée : la fiche de l'arrêt s'ouvre.
  const tapped = arrivalStopId(Notifications.useLastNotificationResponse()?.notification.request.content.data);

  const findStop = (stopId: string | null): RouteStop | null =>
    route?.stops.find(({ stop }) => stop.id === stopId) ?? null;
  const notice = (stopId: string) => {
    const target = findStop(stopId);
    return {
      title: t('map.arrival.title', { stop: target ? pickText(target.stop.name, lang) : '' }),
      body: t('map.arrival.subtitle', { index: target?.index ?? '' }),
    };
  };

  const { position, inside } = useTracking(
    route,
    simulation,
    // Application ouverte : bandeau. En arrière-plan, la notification vient du géofencing système
    // (ou des arrivées programmées du trajet simulé) : pas de doublon ici.
    (stopId) => {
      if (AppState.currentState === 'active') setArrival(stopId);
    },
    notice,
  );
  const here = position.status === 'ready' ? position.position : null;
  // Prochain arrêt : premier non visité devant la position (cf. nextStop).
  const next = route ? nextStop(route, visited, alongOnTrack(route, here?.lngLat ?? null)) : null;

  // Arrêts surveillés par le système (application fermée) : non visités, à partir du prochain.
  const noticeFor = useEffectEvent(notice);
  const nextAlong = next?.along ?? 0;
  useEffect(() => {
    if (!route) return;
    const notices = Object.fromEntries(route.stops.map(({ stop }) => [stop.id, noticeFor(stop.id)]));
    void watchStops(route, visited, nextAlong, notices).catch(() => undefined);
  }, [route, visited, nextAlong]);

  if (!lineId) return <Redirect href="/lignes" />;
  if (!line || !route) return <Screen>{null}</Screen>;

  const guidance = next && here ? guidanceTo(route, here.lngLat, next) : null;
  const name = (target: RouteStop) => pickText(target.stop.name, lang);
  const distance = (meters: number) => formatDistance(t, lang, meters, false);

  const stopState = (stopId: string): StopState =>
    visited.has(stopId) ? 'visited' : stopId === next?.stop.id ? 'next' : 'upcoming';

  const visitedCount = route.stops.filter(({ stop }) => visited.has(stop.id)).length;
  const earnedStamps = (lineStamps.data ?? []).filter((stamp) => progress.data?.stampIds.has(stamp.id)).length;
  const counts = {
    stops: { done: visitedCount, total: route.stops.length },
    points: { done: progress.data?.points ?? 0, total: line.points_max },
    stamps: { done: earnedStamps, total: line.stamp_count },
  };

  const guidanceTitle = !next
    ? t('map.guidance.finished')
    : position.status === 'denied'
      ? t('map.guidance.noLocation')
      : guidance
        ? t(`map.guidance.${guidance.instruction}`)
        : t('map.guidance.locating');
  const guidanceArrow =
    guidance && here && guidance.instruction !== 'arrived'
      ? angleDelta(here.heading ?? guidance.travelBearing, guidance.targetBearing)
      : null;

  const poi = findStop(sheet?.kind === 'poi' ? sheet.stopId : sheet ? null : tapped);
  const closeSheet = () => {
    setSheet(null);
    if (tapped) Notifications.clearLastNotificationResponse();
  };
  const poiAction = (target: RouteStop): PoiAction => {
    const done = visited.has(target.stop.id);
    if (done || inside.has(target.stop.id) || !target.stop.requires_on_site) {
      return { kind: 'play', label: done ? 'relive' : guest ? 'preview' : 'live', guestNote: guest };
    }
    return { kind: 'onSite' };
  };
  const poiStatus = (target: RouteStop) => {
    if (visited.has(target.stop.id)) return t('poi.visited', { index: target.index });
    if (!here) return t('poi.stop', { index: target.index });
    return t('poi.distance', { distance: distance(haversineMeters(here.lngLat, [target.stop.lng, target.stop.lat])) });
  };
  // Le bandeau ne vaut que dans le rayon de l'arrêt (pas au retour d'arrière-plan, loin de là).
  const arrivalStop = arrival && inside.has(arrival) ? findStop(arrival) : null;

  return (
    <View style={styles.screen}>
      <LineMap
        route={route}
        lang={lang}
        stopState={stopState}
        travelled={travelledMeters(route, visited, here?.lngLat ?? null)}
        position={here?.lngLat ?? null}
        nextPill={
          next && guidance && !sheet
            ? { stop: next, label: t('map.nextStop', { index: next.index, distance: distance(guidance.meters) }) }
            : null
        }
        onStopPress={(stopId) => setSheet({ kind: 'poi', stopId })}
        inset={{ top: frame.top(130), bottom: frame.bottom(22) + 85 + 24 }}
        avoid={[
          // Pilule de ligne et bouton Carnet ; carte de progression, Paramètres, Cachets ; guidage.
          { x: 0, y: 0, w: frame.width, h: frame.top(55) + 39 },
          { x: 0, y: 0, w: 31 + 123, h: frame.top(110) + 178 },
          { x: 0, y: frame.height - frame.bottom(22) - 85, w: frame.width, h: frame.bottom(22) + 85 },
        ]}
      />

      <View style={[styles.topRow, { top: frame.top(55) }]}>
        <LinePill
          code={line.code}
          name={pickText(line.name, lang)}
          onLongPress={__DEV__ ? () => router.push('/dev') : undefined}
        />
        <RoundButton label={t('a11y.notebook')} onPress={() => router.push('/carnet')}>
          <ProfileIcon width={15} height={15} />
        </RoundButton>
      </View>

      <View style={[styles.leftColumn, { top: frame.top(110) }]}>
        <ProgressCard
          label={t('a11y.lineSheet')}
          lines={[
            t('map.progressStops', counts.stops),
            t('map.progressPoints', counts.points),
            t('map.progressStamps', counts.stamps),
          ]}
          onPress={() => setSheet({ kind: 'line' })}
        />
        <RoundButton label={t('a11y.settings')} onPress={() => router.push('/parametres')} style={styles.settings}>
          <GearIcon />
        </RoundButton>
        <RoundButton label={t('a11y.stamps')} onPress={() => router.push('/cachets')} style={styles.stamps}>
          <StampsIcon />
        </RoundButton>
      </View>

      <GuidanceBar
        title={guidanceTitle}
        subtitle={
          next
            ? t('map.guidance.next', { mode: t(`transport.modes.${transport}`), stop: name(next) })
            : null
        }
        distance={guidance && guidance.instruction !== 'arrived' ? distance(guidance.meters) : null}
        arrow={guidanceArrow}
        mode={transport}
        style={[styles.guidance, { bottom: frame.bottom(22) }]}
      />

      {focused && arrivalStop && !sheet && (
        <ArrivalBanner
          key={arrivalStop.stop.id}
          title={t('map.arrival.title', { stop: name(arrivalStop) })}
          subtitle={t('map.arrival.subtitle', { index: arrivalStop.index })}
          onOpen={() => {
            setArrival(null);
            setSheet({ kind: 'poi', stopId: arrivalStop.stop.id });
          }}
          onDismiss={() => setArrival(null)}
          style={{ top: insets.top + 6 }}
        />
      )}

      {poi && (
        <PoiSheet
          key={poi.stop.id}
          name={name(poi)}
          status={poiStatus(poi)}
          services={poi.stop.services}
          description={pickText(poi.stop.description, lang)}
          action={poiAction(poi)}
          voucher={offerStops.data?.has(poi.stop.id) ?? false}
          bottomInset={insets.bottom}
          onPlay={() => router.push({ pathname: '/lecteur', params: { stopId: poi.stop.id } })}
          onVoucher={() => router.push('/avantages')}
          onSignup={() => router.push('/inscription')}
          onClose={closeSheet}
        />
      )}

      {sheet?.kind === 'line' && (
        <LineSheet
          code={line.code}
          name={pickText(line.name, lang)}
          rows={[
            { label: t('map.lineSheet.visited'), value: t('map.lineSheet.ratio', counts.stops) },
            { label: t('map.lineSheet.points'), value: t('map.lineSheet.ratio', counts.points) },
            { label: t('map.lineSheet.stamps'), value: t('map.lineSheet.ratio', counts.stamps) },
          ]}
          stamps={(lineStamps.data ?? []).map((stamp) => ({
            id: stamp.id,
            image: stamp.image_media_id ? stampMedia.data?.get(stamp.image_media_id) : null,
            earned: progress.data?.stampIds.has(stamp.id) ?? false,
          }))}
          top={frame.top(52)}
          bottomInset={insets.bottom}
          onClose={closeSheet}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topRow: {
    position: 'absolute',
    left: 27,
    right: 27,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leftColumn: {
    position: 'absolute',
    left: 31,
    alignItems: 'flex-start',
  },
  settings: {
    marginTop: 15,
  },
  stamps: {
    marginTop: 10,
  },
  guidance: {
    position: 'absolute',
    left: 31,
    right: 31,
  },
});
