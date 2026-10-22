import {
  bearingDegrees,
  pointAlongLine,
  simulatedAlong,
  simulatedArrivalAt,
  updatePresence,
  type LngLat,
  type Route,
} from '@llds/shared';
import * as Location from 'expo-location';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { cancelScheduledArrivals, scheduleArrival, type ArrivalNotice } from '@/lib/notifications';

import type { Simulation } from './simulation';

export interface UserPosition {
  lngLat: LngLat;
  /** Précision (mètres) ; null pour une position simulée. */
  accuracy: number | null;
  /** Cap de l'appareil (boussole) ou du trajet simulé ; null si inconnu. */
  heading: number | null;
  simulated: boolean;
}

export type PositionState = { status: 'locating' } | { status: 'denied' } | { status: 'ready'; position: UserPosition };

interface Tracking {
  position: PositionState;
  /** Arrêts dont l'utilisateur est dans le rayon. */
  inside: ReadonlySet<string>;
}

/** Écart de cap (degrés) en dessous duquel la boussole ne relance pas d'affichage. */
const HEADING_STEP = 8;
const SIMULATION_TICK_MS = 1000;

function simulatedPosition(route: Route, simulation: Simulation, now: number): UserPosition {
  if (simulation.kind === 'point') {
    return { lngLat: [simulation.lng, simulation.lat], accuracy: null, heading: null, simulated: true };
  }
  const along = simulatedAlong(route, simulation, now);
  const here = pointAlongLine(route.line, along, route.cumulative);
  const ahead = pointAlongLine(route.line, Math.min(route.length, along + 15), route.cumulative);
  return { lngLat: here, accuracy: null, heading: bearingDegrees(here, ahead), simulated: true };
}

/**
 * Position de l'utilisateur (GPS, ou simulation du menu développeur) et arrêts dont il est dans le rayon.
 * `onEnter` est appelé à chaque entrée dans un rayon (une fois par arrêt et par passage).
 */
export function useTracking(
  route: Route | null,
  simulation: Simulation | null,
  onEnter: (stopId: string) => void,
  notice: (stopId: string) => Omit<ArrivalNotice, 'stopId'>,
): Tracking {
  const [tracking, setTracking] = useState<Tracking>({ position: { status: 'locating' }, inside: new Set() });
  const insideRef = useRef<ReadonlySet<string>>(new Set());
  const enter = useEffectEvent(onEnter);
  const noticeFor = useEffectEvent(notice);

  useEffect(() => {
    if (!route) return;
    const stops = route.stops.map(({ stop }) => stop);
    let heading: number | null = null;
    const accept = (position: UserPosition) => {
      const presence = updatePresence(insideRef.current, position.lngLat, position.accuracy, stops);
      insideRef.current = presence.inside;
      setTracking({ position: { status: 'ready', position }, inside: presence.inside });
      presence.entered.forEach((stopId) => enter(stopId));
    };

    if (simulation) {
      // En arrière-plan, le trajet simulé est relayé par les arrivées programmées ci-dessous.
      const tick = () => {
        if (AppState.currentState === 'active') accept(simulatedPosition(route, simulation, Date.now()));
      };
      const first = setTimeout(tick, 0);
      const timer = setInterval(tick, SIMULATION_TICK_MS);
      // Trajet poursuivi application en arrière-plan : les arrivées à venir sont notifiées à l'heure prévue.
      const appState = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          void cancelScheduledArrivals();
          return;
        }
        if (simulation.kind !== 'trip') return;
        const now = Date.now();
        for (const target of route.stops) {
          const at = simulatedArrivalAt(simulation, target);
          if (at !== null && at > now && !insideRef.current.has(target.stop.id)) {
            void scheduleArrival({ stopId: target.stop.id, ...noticeFor(target.stop.id) }, new Date(at));
          }
        }
      });
      return () => {
        clearTimeout(first);
        clearInterval(timer);
        appState.remove();
        void cancelScheduledArrivals();
      };
    }

    let cancelled = false;
    const subscriptions: { remove: () => void }[] = [];
    let last: UserPosition | null = null;
    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) {
        setTracking((current) => ({ ...current, position: { status: 'denied' } }));
        return;
      }
      const positions = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
        ({ coords }) => {
          last = { lngLat: [coords.longitude, coords.latitude], accuracy: coords.accuracy, heading, simulated: false };
          accept(last);
        },
      );
      const compass = await Location.watchHeadingAsync(({ trueHeading, magHeading }) => {
        const next = trueHeading >= 0 ? trueHeading : magHeading;
        if (heading !== null && Math.abs(next - heading) < HEADING_STEP) return;
        heading = next;
        if (last) setTracking((current) => (last ? { ...current, position: { status: 'ready', position: { ...last, heading } } } : current));
      }).catch(() => null);
      subscriptions.push(positions, ...(compass ? [compass] : []));
      if (cancelled) subscriptions.forEach((subscription) => subscription.remove());
    })();
    return () => {
      cancelled = true;
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [route, simulation]);

  return tracking;
}
