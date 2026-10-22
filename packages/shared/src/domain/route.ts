import type { LngLat, StopOverview } from '../schemas/content';
import type { LineDirection } from '../schemas/enums';
import {
  angleDelta,
  bearingDegrees,
  cumulativeMeters,
  haversineMeters,
  pointAlongLine,
  projectOnLine,
  sliceLine,
} from './geo';

/** Arrêt placé sur le tracé orienté. */
export interface RouteStop {
  stop: StopOverview;
  /** Rang dans le sens de parcours (à partir de 1). */
  index: number;
  /** Distance depuis le départ, le long du tracé (mètres). */
  along: number;
  /** Distance entre l'arrêt et le tracé (mètres). */
  offset: number;
}

/** Tracé et arrêts dans le sens de parcours choisi. */
export interface Route {
  line: LngLat[];
  cumulative: number[];
  length: number;
  stops: RouteStop[];
}

export function buildRoute(track: readonly LngLat[], stops: readonly StopOverview[], direction: LineDirection): Route {
  const line = direction === 'forward' ? [...track] : [...track].reverse();
  const cumulative = cumulativeMeters(line);
  const ordered = [...stops].sort((a, b) => a.position - b.position);
  if (direction === 'backward') ordered.reverse();
  return {
    line,
    cumulative,
    length: cumulative[cumulative.length - 1] ?? 0,
    stops: ordered.map((stop, i) => {
      const { along, offset } = projectOnLine([stop.lng, stop.lat], line, cumulative);
      return { stop, index: i + 1, along, offset };
    }),
  };
}

/**
 * Prochain arrêt : premier non visité dans le sens de parcours (null : ligne terminée). Avec une position
 * sur le tracé (`fromAlong`), premier non visité devant soi — un arrêt dépassé sans faire l'expérience
 * n'impose pas de demi-tour — ou, s'il n'en reste que derrière, le plus proche d'entre eux.
 */
export function nextStop(route: Route, visited: ReadonlySet<string>, fromAlong: number | null = null): RouteStop | null {
  const remaining = route.stops.filter(({ stop }) => !visited.has(stop.id));
  if (fromAlong === null) return remaining[0] ?? null;
  return remaining.find(({ stop, along }) => along >= fromAlong - stop.geofence_radius_m) ?? remaining.at(-1) ?? null;
}

/** Distance le long du tracé jusqu'à la position, ou null si elle est trop loin du tracé. */
export function alongOnTrack(route: Route, position: LngLat | null): number | null {
  if (!position) return null;
  const { along, offset } = projectOnLine(position, route.line, route.cumulative);
  return offset <= ON_TRACK_M ? along : null;
}

/** Distance parcourue le long du tracé : jusqu'au dernier arrêt visité, ou jusqu'à la position si elle est sur le tracé. */
export function travelledMeters(route: Route, visited: ReadonlySet<string>, position: LngLat | null): number {
  const lastVisited = route.stops.reduce((max, { stop, along }) => (visited.has(stop.id) ? Math.max(max, along) : max), 0);
  return Math.max(lastVisited, alongOnTrack(route, position) ?? 0);
}

export function travelledLine(route: Route, meters: number): LngLat[] {
  return sliceLine(route.line, 0, meters, route.cumulative);
}

/** Au-delà de cette distance au tracé, la consigne invite à le rejoindre. */
export const ON_TRACK_M = 60;
/** Changement de cap à partir duquel la consigne devient « tournez ». */
const TURN_DEGREES = 30;
/** Portion du tracé regardée devant soi pour la consigne. */
const LOOKAHEAD_M = 120;
const STEP_M = 15;

export type GuidanceInstruction = 'straight' | 'left' | 'right' | 'join' | 'back' | 'arrived';

export interface Guidance {
  instruction: GuidanceInstruction;
  /** Distance restante jusqu'à l'arrêt visé (le long du tracé quand on le suit). */
  meters: number;
  /** Cap à suivre (degrés depuis le nord). */
  targetBearing: number;
  /** Cap du tracé à la position (sens de marche supposé quand la boussole est indisponible). */
  travelBearing: number;
}

/** Consigne simple vers l'arrêt visé, calculée par rapport au tracé (pas d'itinéraire routier). */
export function guidanceTo(route: Route, position: LngLat, target: RouteStop): Guidance {
  const stopPoint: LngLat = [target.stop.lng, target.stop.lat];
  const direct = haversineMeters(position, stopPoint);
  const { along, offset } = projectOnLine(position, route.line, route.cumulative);
  const at = (meters: number) => pointAlongLine(route.line, meters, route.cumulative);
  const travelBearing = bearingDegrees(at(along), at(Math.min(route.length, along + STEP_M)));

  if (direct <= target.stop.geofence_radius_m) {
    return { instruction: 'arrived', meters: direct, targetBearing: bearingDegrees(position, stopPoint), travelBearing };
  }
  if (offset > ON_TRACK_M) {
    return {
      instruction: 'join',
      meters: offset + Math.abs(target.along - along),
      targetBearing: bearingDegrees(position, at(along)),
      travelBearing,
    };
  }
  const remaining = target.along - along;
  if (remaining < 0) {
    return { instruction: 'back', meters: -remaining, targetBearing: bearingDegrees(position, stopPoint), travelBearing };
  }
  const near = at(Math.min(target.along, along + STEP_M));
  const ahead = at(Math.min(target.along, along + LOOKAHEAD_M));
  const turn = angleDelta(travelBearing, bearingDegrees(near, ahead));
  const instruction = turn >= TURN_DEGREES ? 'right' : turn <= -TURN_DEGREES ? 'left' : 'straight';
  return { instruction, meters: remaining, targetBearing: bearingDegrees(position, ahead), travelBearing };
}

// ── Arrivées ────────────────────────────────────────────────────────────────

/** Positions moins précises ignorées (BEHAVIOR.md). */
export const MAX_ACCURACY_M = 50;
/** Marge de sortie : on ne quitte un rayon qu'au-delà de rayon + marge (évite les alertes en rafale). */
export const EXIT_MARGIN_M = 30;

export interface Presence {
  /** Arrêts dont l'utilisateur est actuellement dans le rayon. */
  inside: Set<string>;
  /** Arrêts dont le rayon vient d'être franchi (une alerte par arrêt et par passage). */
  entered: string[];
}

export function updatePresence(
  inside: ReadonlySet<string>,
  position: LngLat,
  accuracy: number | null,
  stops: readonly Pick<StopOverview, 'id' | 'lat' | 'lng' | 'geofence_radius_m'>[],
): Presence {
  if (accuracy !== null && accuracy > MAX_ACCURACY_M) return { inside: new Set(inside), entered: [] };
  const next = new Set<string>();
  const entered: string[] = [];
  for (const stop of stops) {
    const meters = haversineMeters(position, [stop.lng, stop.lat]);
    if (inside.has(stop.id)) {
      if (meters <= stop.geofence_radius_m + EXIT_MARGIN_M) next.add(stop.id);
    } else if (meters <= stop.geofence_radius_m) {
      next.add(stop.id);
      entered.push(stop.id);
    }
  }
  return { inside: next, entered };
}

// ── Trajet simulé (menu développeur) ────────────────────────────────────────

export interface SimulatedTrip {
  /** Point de départ, le long du tracé orienté (mètres). */
  startAlong: number;
  /** Instant de départ (ms depuis l'époque). */
  startedAt: number;
  speedMps: number;
}

export function simulatedAlong(route: Route, trip: SimulatedTrip, now: number): number {
  return Math.min(route.length, trip.startAlong + (trip.speedMps * Math.max(0, now - trip.startedAt)) / 1000);
}

/**
 * Instant (ms) où le trajet simulé entre dans le rayon d'un arrêt, ou null s'il n'y entre pas
 * (arrêt déjà dépassé, ou trop loin du tracé).
 */
export function simulatedArrivalAt(trip: SimulatedTrip, target: RouteStop): number | null {
  const radius = target.stop.geofence_radius_m;
  if (target.offset > radius || trip.speedMps <= 0) return null;
  const entryAlong = target.along - Math.sqrt(radius ** 2 - target.offset ** 2);
  if (entryAlong < trip.startAlong) return null;
  return trip.startedAt + ((entryAlong - trip.startAlong) / trip.speedMps) * 1000;
}
