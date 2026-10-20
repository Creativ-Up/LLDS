import { tokens } from './generated';

export { tokens };

export const colors = tokens.color;
export const font = tokens.font;
export const typography = tokens.type;
export const radius = tokens.radius;
export const stroke = tokens.stroke;
export const layout = tokens.layout;
export const motion = tokens.motion;

export type ColorToken = Exclude<keyof typeof tokens.color, 'palette' | 'admin'>;
export type TypographyToken = keyof typeof tokens.type;
export type FontWeight = (typeof tokens.font.weights)[number];

/** Courbe d'accélération commune, au format CSS. */
export const easingCss = `cubic-bezier(${tokens.motion.easing.join(', ')})`;

/** Approche (em dans les tokens) convertie en points pour une taille donnée. */
export function letterSpacingPt(em: number, size: number): number {
  return Math.round(em * size * 100) / 100;
}

/** Interligne (multiplicateur dans les tokens) converti en points. */
export function lineHeightPt(multiplier: number, size: number): number {
  return Math.round(multiplier * size * 100) / 100;
}
