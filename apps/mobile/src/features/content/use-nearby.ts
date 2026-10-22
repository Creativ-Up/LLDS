import { distanceToLineMeters, type LineOverview } from '@llds/shared';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type LocationState = { status: 'unknown' } | { status: 'denied' } | { status: 'granted'; lng: number; lat: number } | { status: 'granted-no-fix' };

/** Position actuelle si la localisation est autorisée (dernière position connue, puis position courante). */
export function useCurrentLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: 'unknown' });
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        if (!cancelled) setState({ status: 'denied' });
        return;
      }
      if (!cancelled) setState({ status: 'granted-no-fix' });
      const position =
        (await Location.getLastKnownPositionAsync().catch(() => null)) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null));
      if (position && !cancelled) {
        setState({ status: 'granted', lng: position.coords.longitude, lat: position.coords.latitude });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

export interface NearestLine {
  line: LineOverview;
  meters: number;
}

/** Ligne publiée dont le tracé passe le plus près de l'utilisateur. */
export function nearestPublishedLine(lines: readonly LineOverview[], location: LocationState): NearestLine | null {
  if (location.status !== 'granted') return null;
  let best: NearestLine | null = null;
  for (const line of lines) {
    if (line.status !== 'published' || !line.track_geojson) continue;
    const meters = distanceToLineMeters([location.lng, location.lat], line.track_geojson.coordinates);
    if (!best || meters < best.meters) best = { line, meters };
  }
  return best;
}
