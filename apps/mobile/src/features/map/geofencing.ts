import 'expo-sqlite/localStorage/install';

import type { Route } from '@llds/shared';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';
import { z } from 'zod';

import { notifyArrival, type ArrivalNotice } from '@/lib/notifications';

// Géofencing en arrière-plan (ARCHITECTURE.md) : le système surveille les arrêts non visités les plus
// proches et réveille l'application à l'entrée d'un rayon, même fermée ; on affiche alors la notification
// d'arrivée. Application ouverte, la carte affiche son bandeau (cf. use-arrivals).

const GEOFENCE_TASK = 'llds-geofences';
/** iOS surveille au plus 20 régions par application ; on en garde 15. */
const MAX_REGIONS = 15;
/** Textes des notifications, préparés dans la langue de l'utilisateur à l'enregistrement des régions. */
const NOTICES_KEY = 'llds.geofence-notices';

const noticesSchema = z.record(z.string(), z.object({ title: z.string(), body: z.string() }));

function readNotices(): z.infer<typeof noticesSchema> {
  try {
    const parsed = noticesSchema.safeParse(JSON.parse(localStorage.getItem(NOTICES_KEY) ?? '{}'));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

const eventSchema = z.object({
  eventType: z.enum(Location.GeofencingEventType),
  region: z.object({ identifier: z.string().optional() }),
});

// Défini au chargement du module (importé par la racine) : la tâche doit exister au réveil de l'application.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  const event = eventSchema.safeParse(data);
  if (error || !event.success || event.data.eventType !== Location.GeofencingEventType.Enter) return;
  if (AppState.currentState === 'active') return;
  const stopId = event.data.region.identifier;
  const notice = stopId ? readNotices()[stopId] : undefined;
  if (stopId && notice) await notifyArrival({ stopId, ...notice });
});

/**
 * Surveille les arrêts non visités les plus proches (le long du tracé, depuis la position) ; sans
 * autorisation de localisation en arrière-plan, la surveillance est arrêtée.
 */
export async function watchStops(
  route: Route,
  visited: ReadonlySet<string>,
  fromAlong: number,
  notices: Record<string, Omit<ArrivalNotice, 'stopId'>>,
): Promise<void> {
  const background = await Location.getBackgroundPermissionsAsync();
  if (!background.granted) {
    await stopWatchingStops();
    return;
  }
  const candidates = route.stops
    .filter(({ stop }) => !visited.has(stop.id))
    .sort((a, b) => Math.abs(a.along - fromAlong) - Math.abs(b.along - fromAlong))
    .slice(0, MAX_REGIONS);
  if (candidates.length === 0) {
    await stopWatchingStops();
    return;
  }
  localStorage.setItem(
    NOTICES_KEY,
    JSON.stringify(Object.fromEntries(candidates.map(({ stop }) => [stop.id, notices[stop.id]]))),
  );
  await Location.startGeofencingAsync(
    GEOFENCE_TASK,
    candidates.map(({ stop }) => ({
      identifier: stop.id,
      latitude: stop.lat,
      longitude: stop.lng,
      radius: stop.geofence_radius_m,
      notifyOnEnter: true,
      notifyOnExit: false,
    })),
  );
}

export async function stopWatchingStops(): Promise<void> {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}
