import { lineStringSchema, type LineStringGeometry, type LngLat } from '@llds/shared';
import { gpx, kml } from '@tmcw/togeojson';

export const TRACK_ACCEPT = '.gpx,.kml,.geojson,.json';

type Position = [number, number];

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function toPosition(value: unknown): Position | null {
  if (!Array.isArray(value)) return null;
  const [lng, lat] = value;
  return isNumber(lng) && isNumber(lat) ? [lng, lat] : null;
}

function positions(value: unknown): Position[] {
  return Array.isArray(value) ? value.map(toPosition).filter((p): p is Position => p !== null) : [];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Toutes les polylignes d'un GeoJSON (Feature, FeatureCollection, géométries, collections), dans l'ordre. */
function collectLines(node: unknown, out: Position[][]): void {
  if (!isRecord(node)) return;
  switch (node.type) {
    case 'FeatureCollection':
      if (Array.isArray(node.features)) for (const feature of node.features) collectLines(feature, out);
      return;
    case 'Feature':
      collectLines(node.geometry, out);
      return;
    case 'GeometryCollection':
      if (Array.isArray(node.geometries)) for (const geometry of node.geometries) collectLines(geometry, out);
      return;
    case 'LineString':
      out.push(positions(node.coordinates));
      return;
    case 'MultiLineString':
      if (Array.isArray(node.coordinates)) for (const line of node.coordinates) out.push(positions(line));
      return;
    default:
  }
}

/** Raccorde les segments en une seule ligne (en supprimant les points dupliqués aux jonctions). */
function mergeLines(lines: Position[][]): LngLat[] {
  const merged: LngLat[] = [];
  for (const line of lines) {
    for (const point of line) {
      const last = merged.at(-1);
      if (!last || last[0] !== point[0] || last[1] !== point[1]) merged.push(point);
    }
  }
  return merged;
}

function parseDocument(text: string, extension: string): unknown {
  if (extension === 'gpx' || extension === 'kml') {
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length > 0) return null;
    return extension === 'gpx' ? gpx(xml) : kml(xml);
  }
  return JSON.parse(text);
}

/** Lit un tracé GPX, KML ou GeoJSON et le ramène à une LineString 2D ; null si aucune ligne n'est trouvée. */
export async function parseTrackFile(file: File): Promise<LineStringGeometry | null> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  let document: unknown;
  try {
    document = parseDocument(await file.text(), extension);
  } catch {
    return null;
  }
  const lines: Position[][] = [];
  collectLines(document, lines);
  const parsed = lineStringSchema.safeParse({ type: 'LineString', coordinates: mergeLines(lines) });
  return parsed.success ? parsed.data : null;
}
