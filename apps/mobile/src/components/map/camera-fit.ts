import { bearingDegrees, type LngLat } from '@llds/shared';

// Cadrage initial de la carte, comme la maquette : le sens de parcours (départ → arrivée) pointe vers le
// haut, et le tracé ainsi tourné occupe toute la zone libre entre les éléments posés sur la carte.

const EARTH_CIRCUMFERENCE_M = 40_075_016.686;
/** Taille d'une tuile MapLibre au zoom 0 (points). */
const TILE_SIZE = 512;
const MAX_ZOOM = 17;

export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface RouteView {
  center: LngLat;
  zoom: number;
  bearing: number;
}

export function fitRoute(line: readonly LngLat[], viewport: { width: number; height: number }, padding: Padding): RouteView | null {
  const first = line[0];
  const last = line[line.length - 1];
  if (!first || !last) return null;
  const bearing = bearingDegrees(first, last);

  // Repère local en mètres, tourné pour que le sens de parcours soit l'axe vertical de l'écran.
  const lat0 = line.reduce((sum, [, lat]) => sum + lat, 0) / line.length;
  const lng0 = line.reduce((sum, [lng]) => sum + lng, 0) / line.length;
  const kx = (Math.cos((lat0 * Math.PI) / 180) * EARTH_CIRCUMFERENCE_M) / 360;
  const ky = EARTH_CIRCUMFERENCE_M / 360;
  const theta = (bearing * Math.PI) / 180;
  const rotated = line.map(([lng, lat]) => {
    const x = (lng - lng0) * kx;
    const y = (lat - lat0) * ky;
    // Rotation de −cap : le cap du parcours devient « vers le haut ».
    return [x * Math.cos(theta) - y * Math.sin(theta), x * Math.sin(theta) + y * Math.cos(theta)] as const;
  });
  const xs = rotated.map(([x]) => x);
  const ys = rotated.map(([, y]) => y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

  // Centre de l'emprise tournée, ramené en longitude / latitude.
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const x = cx * Math.cos(theta) + cy * Math.sin(theta);
  const y = -cx * Math.sin(theta) + cy * Math.cos(theta);
  const center: LngLat = [lng0 + x / kx, lat0 + y / ky];

  const width = Math.max(1, viewport.width - padding.left - padding.right);
  const height = Math.max(1, viewport.height - padding.top - padding.bottom);
  const metersPerPoint = Math.max((maxX - minX) / width, (maxY - minY) / height, 0.01);
  const zoom = Math.log2((EARTH_CIRCUMFERENCE_M * Math.cos((lat0 * Math.PI) / 180)) / (TILE_SIZE * metersPerPoint));
  return { center, zoom: Math.min(MAX_ZOOM, zoom), bearing };
}
