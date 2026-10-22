// Placement des étiquettes de la carte en coordonnées écran : chaque étiquette prend le premier côté libre
// (sans recouvrir une étiquette déjà posée, un arrêt ou le tracé, et sans sortir de l'écran) ; à défaut,
// elle est masquée jusqu'au prochain déplacement de la carte.

/** Côtés autour d'un arrêt ; les diagonales évitent un tracé qui passe en oblique. */
export type Side = 'right' | 'left' | 'above' | 'below' | 'aboveRight' | 'aboveLeft' | 'belowRight' | 'belowLeft';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Écarts entre le centre de l'arrêt et l'étiquette : côtés, dessus / dessous, diagonales. */
export interface Gaps {
  side: number;
  vertical: number;
  diagonal: number;
}

export interface LabelRequest {
  id: string;
  /** Point d'ancrage à l'écran (centre de l'arrêt). */
  at: [number, number];
  width: number;
  height: number;
  gaps: Gaps;
  sides: readonly Side[];
}

const MARGIN = 4;

/** Rectangle occupé par une étiquette posée d'un côté de son point. */
export function labelBox({ at: [x, y], width: w, height: h, gaps }: LabelRequest, side: Side): Box {
  const { side: gx, vertical: gy, diagonal: gd } = gaps;
  switch (side) {
    case 'right':
      return { x: x + gx, y: y - h / 2, w, h };
    case 'left':
      return { x: x - gx - w, y: y - h / 2, w, h };
    case 'above':
      return { x: x - w / 2, y: y - gy - h, w, h };
    case 'below':
      return { x: x - w / 2, y: y + gy, w, h };
    case 'aboveRight':
      return { x: x + gd, y: y - gd - h, w, h };
    case 'aboveLeft':
      return { x: x - gd - w, y: y - gd - h, w, h };
    case 'belowRight':
      return { x: x + gd, y: y + gd, w, h };
    case 'belowLeft':
      return { x: x - gd - w, y: y + gd, w, h };
  }
}

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w + MARGIN && b.x < a.x + a.w + MARGIN && a.y < b.y + b.h + MARGIN && b.y < a.y + a.h + MARGIN;

/** Côté retenu pour chaque étiquette, par ordre de priorité ; absente si aucun côté n'est libre. */
export function placeLabels(
  requests: readonly LabelRequest[],
  obstacles: readonly Box[],
  viewport: { width: number; height: number },
): Record<string, Side> {
  const taken: Box[] = [...obstacles];
  const placed: Record<string, Side> = {};
  for (const request of requests) {
    const side = request.sides.find((candidate) => {
      const box = labelBox(request, candidate);
      const inside =
        box.x >= MARGIN && box.y >= MARGIN && box.x + box.w <= viewport.width - MARGIN && box.y + box.h <= viewport.height - MARGIN;
      return inside && !taken.some((other) => overlaps(box, other));
    });
    if (side) {
      placed[request.id] = side;
      taken.push(labelBox(request, side));
    }
  }
  return placed;
}

/** Obstacle carré centré sur un point (arrêt, point du tracé). */
export function pointBox([x, y]: [number, number], size: number): Box {
  return { x: x - size / 2, y: y - size / 2, w: size, h: size };
}
