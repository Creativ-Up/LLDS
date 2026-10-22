import type { LngLat } from '../schemas/content';

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance orthodromique entre deux points (mètres). */
export function haversineMeters([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Distance la plus courte (mètres) entre un point et une polyligne.
 * Projection équirectangulaire locale : précise à l'échelle d'une ligne (quelques dizaines de km).
 */
export function distanceToLineMeters(point: LngLat, line: readonly LngLat[]): number {
  const [first] = line;
  if (!first) return Number.POSITIVE_INFINITY;
  if (line.length === 1) return haversineMeters(point, first);

  const kx = Math.cos(toRad(point[1])) * toRad(1) * EARTH_RADIUS_M;
  const ky = toRad(1) * EARTH_RADIUS_M;
  const project = ([lng, lat]: LngLat): [number, number] => [(lng - point[0]) * kx, (lat - point[1]) * ky];

  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < line.length - 1; i += 1) {
    const a = line[i];
    const b = line[i + 1];
    if (!a || !b) continue;
    const [ax, ay] = project(a);
    const [bx, by] = project(b);
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSq));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}

/** Cap initial (degrés, 0 = nord, sens horaire) pour aller de `from` à `to`. */
export function bearingDegrees([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Écart signé entre deux caps, ramené dans ]-180, 180] (positif = vers la droite). */
export function angleDelta(from: number, to: number): number {
  const delta = (((to - from) % 360) + 360) % 360;
  return delta > 180 ? delta - 360 : delta;
}

/** Distances cumulées (mètres) depuis le début de la polyligne, une par sommet. */
export function cumulativeMeters(line: readonly LngLat[]): number[] {
  return line.reduce<number[]>((acc, point, i) => {
    const previous = line[i - 1];
    acc.push(previous ? (acc[i - 1] ?? 0) + haversineMeters(previous, point) : 0);
    return acc;
  }, []);
}

/** Position d'un point rapportée à une polyligne. */
export interface LinePosition {
  /** Distance le long de la polyligne jusqu'au point projeté (mètres). */
  along: number;
  /** Distance entre le point et la polyligne (mètres). */
  offset: number;
}

/** Projette un point sur une polyligne (projection équirectangulaire locale, cf. `distanceToLineMeters`). */
export function projectOnLine(point: LngLat, line: readonly LngLat[], cumulative = cumulativeMeters(line)): LinePosition {
  const [first] = line;
  if (!first) return { along: 0, offset: Number.POSITIVE_INFINITY };
  if (line.length === 1) return { along: 0, offset: haversineMeters(point, first) };

  const kx = Math.cos(toRad(point[1])) * toRad(1) * EARTH_RADIUS_M;
  const ky = toRad(1) * EARTH_RADIUS_M;
  const project = ([lng, lat]: LngLat): [number, number] => [(lng - point[0]) * kx, (lat - point[1]) * ky];

  let best: LinePosition = { along: 0, offset: Number.POSITIVE_INFINITY };
  for (let i = 0; i < line.length - 1; i += 1) {
    const a = line[i];
    const b = line[i + 1];
    if (!a || !b) continue;
    const [ax, ay] = project(a);
    const [bx, by] = project(b);
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSq));
    const offset = Math.hypot(ax + t * dx, ay + t * dy);
    if (offset < best.offset) {
      const start = cumulative[i] ?? 0;
      best = { along: start + t * ((cumulative[i + 1] ?? start) - start), offset };
    }
  }
  return best;
}

/** Point situé à `meters` du début de la polyligne (borné à ses extrémités). */
export function pointAlongLine(line: readonly LngLat[], meters: number, cumulative = cumulativeMeters(line)): LngLat {
  const last = line[line.length - 1];
  if (!last) return [0, 0];
  for (let i = 0; i < line.length - 1; i += 1) {
    const a = line[i];
    const b = line[i + 1];
    const start = cumulative[i] ?? 0;
    const end = cumulative[i + 1] ?? start;
    if (!a || !b || meters > end) continue;
    const t = end === start ? 0 : Math.max(0, (meters - start) / (end - start));
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }
  return last;
}

/** Portion de la polyligne entre deux distances depuis son début. */
export function sliceLine(
  line: readonly LngLat[],
  from: number,
  to: number,
  cumulative = cumulativeMeters(line),
): LngLat[] {
  if (to <= from) return [];
  const inside = line.filter((_, i) => {
    const at = cumulative[i] ?? 0;
    return at > from && at < to;
  });
  return [pointAlongLine(line, from, cumulative), ...inside, pointAlongLine(line, to, cumulative)];
}

/** Arrondi d'une durée estimée : à 5 min sous une heure, au quart d'heure au-delà. */
export function roundDurationMinutes(minutes: number): number {
  const step = minutes < 60 ? 5 : 15;
  return Math.max(step, Math.round(minutes / step) * step);
}
