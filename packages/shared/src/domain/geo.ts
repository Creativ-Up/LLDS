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

/** Arrondi d'une durée estimée : à 5 min sous une heure, au quart d'heure au-delà. */
export function roundDurationMinutes(minutes: number): number {
  const step = minutes < 60 ? 5 : 15;
  return Math.max(step, Math.round(minutes / step) * step);
}
