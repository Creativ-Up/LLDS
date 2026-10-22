import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { LngLat, StopOverview } from '../schemas/content';
import { cumulativeMeters, haversineMeters, pointAlongLine, projectOnLine, sliceLine } from './geo';
import {
  buildRoute,
  guidanceTo,
  nextStop,
  simulatedAlong,
  simulatedArrivalAt,
  travelledMeters,
  updatePresence,
  type Route,
} from './route';

// Tracé en L près de Lessines : ~1 km vers l'est, puis ~1 km vers le nord.
const EAST: LngLat = [3.8414, 50.7116];
const CORNER: LngLat = [3.8556, 50.7116];
const NORTH: LngLat = [3.8556, 50.7206];
const TRACK: LngLat[] = [EAST, CORNER, NORTH];

function stop(id: string, position: number, [lng, lat]: LngLat, radius = 80): StopOverview {
  return {
    id,
    line_id: 'l',
    position,
    name: { fr: id },
    year: null,
    lat,
    lng,
    geofence_radius_m: radius,
    description: {},
    services: [],
    points: 50,
    requires_on_site: true,
    archive_media_id: null,
    present_media_id: null,
    stamp_id: null,
    guest_preview_s: 12,
  };
}

const STOPS = [stop('a', 1, EAST), stop('b', 2, CORNER), stop('c', 3, NORTH)];

describe('géométrie', () => {
  test('projection et point le long du tracé sont réciproques', () => {
    const cumulative = cumulativeMeters(TRACK);
    const total = cumulative[2] ?? 0;
    assert.ok(total > 1900 && total < 2100, `longueur ${total}`);
    const middle = pointAlongLine(TRACK, 1500, cumulative);
    const { along, offset } = projectOnLine(middle, TRACK, cumulative);
    assert.ok(Math.abs(along - 1500) < 1);
    assert.ok(offset < 1);
  });

  test('la découpe commence et finit aux distances demandées', () => {
    const part = sliceLine(TRACK, 500, 1500);
    assert.equal(part.length, 3);
    const length = cumulativeMeters(part).at(-1) ?? 0;
    assert.ok(Math.abs(length - 1000) < 2, `longueur ${length}`);
  });
});

describe('parcours', () => {
  test('le sens retour inverse le tracé et les arrêts', () => {
    const route = buildRoute(TRACK, STOPS, 'backward');
    assert.deepEqual(
      route.stops.map(({ stop: s, index }) => [s.id, index]),
      [
        ['c', 1],
        ['b', 2],
        ['a', 3],
      ],
    );
    assert.ok((route.stops[0]?.along ?? 1) < 1);
  });

  test('prochain arrêt : premier non visité dans le sens choisi', () => {
    const route = buildRoute(TRACK, STOPS, 'forward');
    assert.equal(nextStop(route, new Set(['a']))?.stop.id, 'b');
    assert.equal(nextStop(route, new Set(['a', 'b', 'c'])), null);
  });

  test('prochain arrêt : devant la position, sans demi-tour pour un arrêt dépassé', () => {
    const route = buildRoute(TRACK, STOPS, 'forward');
    const corner = route.stops[1]?.along ?? 0;
    assert.equal(nextStop(route, new Set(), 300)?.stop.id, 'b');
    assert.equal(nextStop(route, new Set(), corner + 300)?.stop.id, 'c');
    assert.equal(nextStop(route, new Set(['c']), corner + 300)?.stop.id, 'b', 'plus que des arrêts derrière : le plus proche');
  });

  test('distance parcourue : dernier arrêt visité, ou position sur le tracé', () => {
    const route = buildRoute(TRACK, STOPS, 'forward');
    const corner = route.stops[1]?.along ?? 0;
    assert.equal(travelledMeters(route, new Set(['a', 'b']), null), corner);
    const ahead = pointAlongLine(route.line, corner + 300, route.cumulative);
    assert.ok(Math.abs(travelledMeters(route, new Set(['a', 'b']), ahead) - (corner + 300)) < 1);
    const farAway: LngLat = [3.9, 50.75];
    assert.equal(travelledMeters(route, new Set(['a', 'b']), farAway), corner);
  });
});

describe('guidage', () => {
  const route: Route = buildRoute(TRACK, STOPS, 'forward');
  const target = route.stops[2];
  assert.ok(target);
  const corner = route.stops[1]?.along ?? 0;
  const at = (meters: number) => pointAlongLine(route.line, meters, route.cumulative);

  test('tout droit loin du virage, à gauche juste avant', () => {
    assert.equal(guidanceTo(route, at(200), target).instruction, 'straight');
    assert.equal(guidanceTo(route, at(corner - 50), target).instruction, 'left');
  });

  test('distance restante mesurée le long du tracé', () => {
    const guidance = guidanceTo(route, at(500), target);
    assert.ok(Math.abs(guidance.meters - (target.along - 500)) < 1);
  });

  test('rejoindre le tracé quand on s’en écarte, arrivé dans le rayon', () => {
    const offTrack: LngLat = [3.848, 50.7140];
    assert.equal(guidanceTo(route, offTrack, target).instruction, 'join');
    assert.equal(guidanceTo(route, NORTH, target).instruction, 'arrived');
  });

  test('demi-tour quand l’arrêt visé est derrière', () => {
    const behind = route.stops[0];
    assert.ok(behind);
    assert.equal(guidanceTo(route, at(600), behind).instruction, 'back');
  });
});

describe('arrivées', () => {
  const near = (point: LngLat, northMeters: number): LngLat => [point[0], point[1] + northMeters / 111_195];

  test('une alerte à l’entrée, aucune tant qu’on reste dans le rayon', () => {
    const first = updatePresence(new Set(), near(CORNER, 60), 10, STOPS);
    assert.deepEqual(first.entered, ['b']);
    const second = updatePresence(first.inside, near(CORNER, 40), 10, STOPS);
    assert.deepEqual(second.entered, []);
  });

  test('sortie au-delà de la marge, nouvelle alerte au passage suivant', () => {
    const inside = new Set(['b']);
    const edge = updatePresence(inside, near(CORNER, 100), 10, STOPS);
    assert.ok(edge.inside.has('b'), 'encore dedans dans la marge');
    const out = updatePresence(inside, near(CORNER, 150), 10, STOPS);
    assert.ok(!out.inside.has('b'));
    assert.deepEqual(updatePresence(out.inside, near(CORNER, 20), 10, STOPS).entered, ['b']);
  });

  test('positions imprécises ignorées', () => {
    assert.deepEqual(updatePresence(new Set(), CORNER, 120, STOPS).entered, []);
    assert.ok(haversineMeters(CORNER, near(CORNER, 60)) < 61);
  });
});

describe('trajet simulé', () => {
  const route = buildRoute(TRACK, STOPS, 'forward');
  const trip = { startAlong: 0, startedAt: 1_000_000, speedMps: 10 };

  test('avance à vitesse constante et s’arrête au bout du tracé', () => {
    assert.equal(simulatedAlong(route, trip, trip.startedAt + 30_000), 300);
    assert.equal(simulatedAlong(route, trip, trip.startedAt + 10_000_000), route.length);
  });

  test('heure d’entrée dans le rayon d’un arrêt', () => {
    const target = route.stops[1];
    assert.ok(target);
    const at = simulatedArrivalAt(trip, target);
    assert.ok(at !== null);
    const along = simulatedAlong(route, trip, at);
    const meters = haversineMeters(pointAlongLine(route.line, along, route.cumulative), [target.stop.lng, target.stop.lat]);
    assert.ok(Math.abs(meters - target.stop.geofence_radius_m) < 2, `entrée à ${meters} m`);
    assert.equal(simulatedArrivalAt({ ...trip, startAlong: target.along + 200 }, target), null);
  });
});
