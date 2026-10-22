import 'expo-sqlite/localStorage/install';

import { lineDirectionSchema, type LineDirection } from '@llds/shared';
import { useSyncExternalStore } from 'react';
import { z } from 'zod';

// Simulation de position (menu développeur) : remplace le GPS sur la carte pour tester les arrivées
// sans se déplacer. Point fixe, ou trajet le long du tracé à vitesse constante. Ignorée hors __DEV__.

const STORAGE_KEY = 'llds.simulation';

const simulationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('point'), lineId: z.string(), lng: z.number(), lat: z.number() }),
  z.object({
    kind: z.literal('trip'),
    lineId: z.string(),
    direction: lineDirectionSchema,
    startAlong: z.number(),
    startedAt: z.number(),
    speedMps: z.number().positive(),
  }),
]);

export type Simulation = z.infer<typeof simulationSchema>;

function read(): Simulation | null {
  if (!__DEV__) return null;
  try {
    const parsed = simulationSchema.safeParse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

let current = read();
const listeners = new Set<() => void>();

export function setSimulation(next: Simulation | null): void {
  current = next;
  if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

/** Démarre un trajet simulé maintenant. */
export function startSimulatedTrip(trip: Omit<Extract<Simulation, { kind: 'trip' }>, 'kind' | 'startedAt'>): void {
  setSimulation({ kind: 'trip', ...trip, startedAt: Date.now() });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSimulation(): Simulation | null {
  return useSyncExternalStore(subscribe, () => current);
}

/** Simulation applicable à la ligne affichée (même ligne, et même sens pour un trajet). */
export function simulationFor(simulation: Simulation | null, lineId: string | undefined, direction: LineDirection) {
  if (!simulation || simulation.lineId !== lineId) return null;
  return simulation.kind === 'trip' && simulation.direction !== direction ? null : simulation;
}
