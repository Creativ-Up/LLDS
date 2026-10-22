import LockIcon from '@llds/assets/icons/lock.svg';
import { pickText, pointAlongLine, sliceLine, type Lang, type LngLat, type Route, type RouteStop } from '@llds/shared';
import { letterSpacingPt } from '@llds/shared/tokens';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type MapRef,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors, interFamily, motion } from '@/theme';

import { fitRoute } from './camera-fit';
import { placeLabels, pointBox, type Box, type Gaps, type LabelRequest, type Side } from './label-layout';

// Carte sans tuiles (ARCHITECTURE.md) : fond crème, tracé et arrêts en GeoJSON, utilisable hors ligne.
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'fond', type: 'background', paint: { 'background-color': colors.cream } }],
};

const TRACK_WIDTH = 7;
/** Écart horizontal entre un arrêt et son nom (maquette : 29 pt). */
const LABEL_GAP = 29;
const PILL_GAP = 22;

export type StopState = 'visited' | 'next' | 'upcoming';

interface LineMapProps {
  route: Route;
  lang: Lang;
  stopState: (stopId: string) => StopState;
  /** Mètres parcourus depuis le départ (partie du tracé dessinée à l'ouverture). */
  travelled: number;
  position: LngLat | null;
  /** Pastille du prochain arrêt (« Arrêt 5 · 150 m »). */
  nextPill: { stop: RouteStop; label: string } | null;
  onStopPress: (stopId: string) => void;
  /** Marges réservées par les éléments posés sur la carte (haut, bas). */
  inset: { top: number; bottom: number };
  /** Zones de l'écran occupées par ces éléments : les noms et la pastille les évitent. */
  avoid: readonly Box[];
}

function lineFeature(coordinates: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } };
}

/** Animation `draw` (1,1 s, ease-out) : longueur dessinée de la partie parcourue. */
function useDrawnMeters(target: number): number {
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const from = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / motion.draw);
      setDrawn(from + (target - from) * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return drawn;
}

function StopDot({ state }: { state: StopState }) {
  if (state === 'visited') {
    return (
      <Svg width={28} height={28}>
        <Circle cx={14} cy={14} r={13} fill={colors.red} />
      </Svg>
    );
  }
  if (state === 'next') {
    return (
      <Svg width={32} height={32}>
        <Circle cx={16} cy={16} r={13} fill={colors.cream} stroke={colors.red} strokeWidth={3} strokeDasharray="11 6" />
        <Circle cx={16} cy={16} r={5} fill={colors.red} />
      </Svg>
    );
  }
  return (
    <View style={styles.upcoming}>
      <Svg width={28} height={28} style={StyleSheet.absoluteFill}>
        <Circle cx={14} cy={14} r={12} fill={colors.cream} stroke={colors.rose} strokeWidth={1.8} strokeDasharray="4 3.4" />
      </Svg>
      <LockIcon width={14} height={14} />
    </View>
  );
}

/** Position : point 16 `tilleul` cerclé de crème et halo pulsé (2,2 s). */
function PositionDot() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: motion.pulse, easing: Easing.out(Easing.quad) }), -1);
  }, [progress]);
  const halo = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [{ scale: 1 + 0.9 * progress.value }],
  }));
  return (
    <View style={styles.position}>
      <Animated.View style={[styles.positionHalo, halo]} />
      <View style={styles.positionDot} />
    </View>
  );
}

/** Côtés essayés, dans l'ordre : la pastille à droite comme la maquette, les noms à côté de l'arrêt. */
const PILL_SIDES: readonly Side[] = ['right', 'left', 'belowRight', 'aboveRight', 'belowLeft', 'aboveLeft', 'below', 'above'];
const LABEL_SIDES: readonly Side[] = ['right', 'left', 'aboveRight', 'belowRight', 'aboveLeft', 'belowLeft', 'above', 'below'];
/** Largeurs estimées (Inter 700 15 pt capitales + approche ; Inter 500 12,5 pt) pour éviter les chevauchements. */
const LABEL_CHAR_WIDTH = 10.4;
const LABEL_LINE_HEIGHT = 18;
/** Au-delà, le nom passe sur plusieurs lignes (« GARE DE » / « BASSILLY »). */
const LABEL_MAX_WIDTH = 150;
const PILL_CHAR_WIDTH = 7.2;
const PILL_PADDING = 28;
const PILL_HEIGHT = 27;
/** Points du tracé projetés pour que les étiquettes ne le recouvrent pas. */
const TRACK_SAMPLES = 48;

type MarkerAnchor = NonNullable<ComponentProps<typeof Marker>['anchor']>;

/** Ancrage du marqueur correspondant au côté choisi (cf. `labelBox`). */
function markerPlacement(side: Side, { side: gx, vertical: gy, diagonal: gd }: Gaps): { anchor: MarkerAnchor; offset: [number, number] } {
  switch (side) {
    case 'right':
      return { anchor: 'left', offset: [gx, 0] };
    case 'left':
      return { anchor: 'right', offset: [-gx, 0] };
    case 'above':
      return { anchor: 'bottom', offset: [0, -gy] };
    case 'below':
      return { anchor: 'top', offset: [0, gy] };
    case 'aboveRight':
      return { anchor: 'bottom-left', offset: [gd, -gd] };
    case 'aboveLeft':
      return { anchor: 'bottom-right', offset: [-gd, -gd] };
    case 'belowRight':
      return { anchor: 'top-left', offset: [gd, gd] };
    case 'belowLeft':
      return { anchor: 'top-right', offset: [-gd, gd] };
  }
}

// Écarts supérieurs au rayon du disque de l'arrêt (15 pt) plus la marge de placement.
const LABEL_GAPS: Gaps = { side: LABEL_GAP, vertical: 22, diagonal: 20 };
const PILL_GAPS: Gaps = { side: PILL_GAP, vertical: 22, diagonal: 20 };

/** Coupe un nom en lignes de largeur estimée inférieure à LABEL_MAX_WIDTH (un mot trop long reste entier). */
function wrapLabel(text: string): string[] {
  const maxChars = Math.floor(LABEL_MAX_WIDTH / LABEL_CHAR_WIDTH);
  return text.split(/\s+/).reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= maxChars) return [...lines.slice(0, -1), `${last} ${word}`];
    return [...lines, word];
  }, []);
}

const LABEL_ALIGN: Record<Side, 'left' | 'right' | 'center'> = {
  right: 'left',
  aboveRight: 'left',
  belowRight: 'left',
  left: 'right',
  aboveLeft: 'right',
  belowLeft: 'right',
  above: 'center',
  below: 'center',
};
const ORIGIN: [number, number] = [0, 0];
/** Marges latérales du cadrage initial : les noms tiennent de part et d'autre du tracé. */
const SIDE_PADDING = 72;

export function LineMap({ route, lang, stopState, travelled, position, nextPill, onStopPress, inset, avoid }: LineMapProps) {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef>(null);
  // La projection native n'existe qu'une fois la carte chargée (avant : plantage natif de MapLibre).
  const loaded = useRef(false);
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const [layout, setLayout] = useState<{ labels: Record<string, Side>; pill: Side | null }>({ labels: {}, pill: null });
  const drawn = useDrawnMeters(travelled);
  const ahead = sliceLine(route.line, travelled, route.length, route.cumulative);
  const done = sliceLine(route.line, 0, drawn, route.cumulative);
  const labelOf = (target: RouteStop) => wrapLabel(pickText(target.stop.name, lang).toUpperCase());
  const padding = { top: inset.top, bottom: inset.bottom, left: SIDE_PADDING, right: SIDE_PADDING };
  const view = viewport ? fitRoute(route.line, viewport, padding) : null;

  // Après chaque déplacement de la carte : arrêts et tracé projetés, puis étiquettes posées sans chevauchement.
  async function relayout() {
    const map = mapRef.current;
    if (!map || !viewport || !loaded.current) return;
    const project = (lngLat: LngLat) => map.project(lngLat);
    const samples = Array.from({ length: TRACK_SAMPLES + 1 }, (_, i) =>
      pointAlongLine(route.line, (route.length * i) / TRACK_SAMPLES, route.cumulative),
    );
    const [stops, track] = await Promise.all([
      Promise.all(route.stops.map(({ stop }) => project([stop.lng, stop.lat]))),
      Promise.all(samples.map(project)),
    ]);
    const at = new globalThis.Map(route.stops.map((target, i) => [target.stop.id, stops[i] ?? ORIGIN]));
    const obstacles = [
      ...avoid,
      ...stops.map((point) => pointBox(point, 30)),
      ...track.map((point) => pointBox(point, TRACK_WIDTH + 1)),
    ];
    const pillRequest: LabelRequest[] = nextPill
      ? [
          {
            id: 'pill',
            at: at.get(nextPill.stop.stop.id) ?? ORIGIN,
            width: nextPill.label.length * PILL_CHAR_WIDTH + PILL_PADDING,
            height: PILL_HEIGHT,
            gaps: PILL_GAPS,
            sides: PILL_SIDES,
          },
        ]
      : [];
    // Priorité : prochain arrêt, départ, terminus, puis les autres dans l'ordre du parcours.
    const priority = (target: RouteStop) =>
      target.stop.id === nextPill?.stop.stop.id ? 0 : target.index === 1 ? 1 : target.index === route.stops.length ? 2 : 3;
    const labelRequests = [...route.stops]
      .sort((a, b) => priority(a) - priority(b) || a.index - b.index)
      .map((target) => {
        const lines = labelOf(target);
        return {
          id: target.stop.id,
          at: at.get(target.stop.id) ?? ORIGIN,
          width: Math.max(...lines.map((line) => line.length)) * LABEL_CHAR_WIDTH,
          height: lines.length * LABEL_LINE_HEIGHT,
          gaps: LABEL_GAPS,
          sides: LABEL_SIDES,
        };
      });
    const { pill = null, ...labels } = placeLabels([...pillRequest, ...labelRequests], obstacles, viewport);
    setLayout({ labels, pill });
  }

  const nextKey = nextPill ? `${nextPill.stop.stop.id}:${nextPill.label}` : '';
  useEffect(() => {
    void relayout();
    // Recalcul quand la taille de la carte ou la pastille change ; les déplacements passent par onRegionDidChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport, nextKey, route, lang]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={({ nativeEvent }) => setViewport({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })}
    >
      {view && (
        <Map
          ref={mapRef}
          mapStyle={MAP_STYLE}
          style={StyleSheet.absoluteFill}
          logo={false}
          attribution={false}
          compass={false}
          touchRotate={false}
          touchPitch={false}
          onDidFinishLoadingMap={() => {
            loaded.current = true;
            void relayout();
          }}
          onRegionDidChange={() => void relayout()}
        >
          <Camera initialViewState={{ ...view, padding }} />
          {ahead.length > 1 && (
            <GeoJSONSource id="trace-a-venir" data={lineFeature(ahead)}>
              <Layer
                id="trace-a-venir"
                type="line"
                style={{ lineColor: colors.ink, lineWidth: TRACK_WIDTH, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.92 }}
              />
            </GeoJSONSource>
          )}
          {done.length > 1 && (
            <GeoJSONSource id="trace-parcouru" data={lineFeature(done)}>
              <Layer
                id="trace-parcouru"
                type="line"
                style={{ lineColor: colors.ink, lineWidth: TRACK_WIDTH, lineCap: 'round', lineJoin: 'round' }}
              />
            </GeoJSONSource>
          )}

          {route.stops.map((target) => {
            const side = layout.labels[target.stop.id];
            if (!side) return null;
            return (
              <Marker
                key={`label-${target.stop.id}-${side}`}
                id={`label-${target.stop.id}`}
                lngLat={[target.stop.lng, target.stop.lat]}
                {...markerPlacement(side, LABEL_GAPS)}
              >
                <Text style={[styles.label, { textAlign: LABEL_ALIGN[side] }]} importantForAccessibility="no-hide-descendants">
                  {labelOf(target).join('\n')}
                </Text>
              </Marker>
            );
          })}

          {route.stops.map(({ stop, index }) => (
            <Marker
              key={stop.id}
              id={stop.id}
              lngLat={[stop.lng, stop.lat]}
              onPress={() => onStopPress(stop.id)}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.stop', { name: pickText(stop.name, lang), index })}
            >
              <View style={styles.hit}>
                <StopDot state={stopState(stop.id)} />
              </View>
            </Marker>
          ))}

          {nextPill && layout.pill && (
            <Marker
              key={`prochain-arret-${layout.pill}`}
              id="prochain-arret"
              lngLat={[nextPill.stop.stop.lng, nextPill.stop.stop.lat]}
              {...markerPlacement(layout.pill, PILL_GAPS)}
              onPress={() => onStopPress(nextPill.stop.stop.id)}
              accessibilityRole="button"
            >
              <View style={styles.pill}>
                <Text style={styles.pillText}>{nextPill.label}</Text>
              </View>
            </Marker>
          )}

          {position && (
            <Marker id="position" lngLat={position} accessibilityLabel={t('a11y.position')}>
              <PositionDot />
            </Marker>
          )}
        </Map>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcoming: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: interFamily(700),
    fontSize: 15,
    lineHeight: LABEL_LINE_HEIGHT,
    letterSpacing: letterSpacingPt(0.073, 15),
    color: colors.ink,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.red,
    shadowColor: colors.red,
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  pillText: {
    fontFamily: interFamily(500),
    fontSize: 12.5,
    lineHeight: 12.5 * 1.2,
    color: colors.white,
  },
  position: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 17.5,
    backgroundColor: colors.haloTilleul,
  },
  positionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cream,
    backgroundColor: colors.tilleul,
  },
});
