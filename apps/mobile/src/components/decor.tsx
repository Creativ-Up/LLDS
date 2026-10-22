import { StyleSheet } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

// Fond décoratif (tickets roses et courbes fines), coordonnées de la maquette (390 × 852),
// ancré au bas de l'écran, non interactif, opacité globale 0,5.

interface Ticket {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  rx?: number;
}

interface DecorSpec {
  curves: string[];
  curveOpacity: number;
  tickets: Ticket[];
  ticketOpacity: number;
}

const DECOR = {
  auth: {
    curves: ['M -40 760 C 120 660 280 620 460 590'],
    curveOpacity: 0.5,
    tickets: [
      { x: 36, y: 700, w: 62, h: 38, rotate: -10 },
      { x: 270, y: 660, w: 54, h: 32, rotate: 12 },
    ],
    ticketOpacity: 0.24,
  },
  language: {
    curves: ['M -60 620 C 90 520 250 470 460 430', 'M -40 760 C 120 640 300 590 470 560'],
    curveOpacity: 0.55,
    tickets: [
      { x: 24, y: 520, w: 52, h: 30, rotate: -14 },
      { x: 268, y: 470, w: 44, h: 26, rotate: 9 },
      { x: 188, y: 690, w: 70, h: 40, rotate: -6 },
      { x: 96, y: 612, w: 30, h: 18, rotate: 20, rx: 2 },
      { x: 320, y: 660, w: 58, h: 34, rotate: -11 },
    ],
    ticketOpacity: 0.28,
  },
  transport: {
    curves: ['M -60 620 C 90 520 250 470 460 430', 'M -40 780 C 120 660 300 610 470 580'],
    curveOpacity: 0.55,
    tickets: [
      { x: 10, y: 500, w: 48, h: 28, rotate: -14 },
      { x: 280, y: 520, w: 52, h: 30, rotate: 10 },
      { x: 176, y: 700, w: 76, h: 44, rotate: -7 },
      { x: 60, y: 760, w: 40, h: 24, rotate: 16 },
    ],
    ticketOpacity: 0.26,
  },
  experience: {
    curves: ['M 420 330 C 300 420 160 560 60 852', 'M 470 400 C 350 490 210 640 120 852'],
    curveOpacity: 0.5,
    tickets: [
      { x: 96, y: 580, w: 60, h: 120, rotate: -12, rx: 4 },
      { x: 240, y: 690, w: 70, h: 46, rotate: 8 },
      { x: 130, y: 520, w: 34, h: 22, rotate: -20, rx: 2 },
      { x: 290, y: 420, w: 44, h: 26, rotate: 14 },
    ],
    ticketOpacity: 0.24,
  },
  ready: {
    curves: ['M -40 700 C 120 600 280 560 460 520'],
    curveOpacity: 0.5,
    tickets: [
      { x: 40, y: 640, w: 70, h: 42, rotate: -10 },
      { x: 250, y: 600, w: 56, h: 34, rotate: 12 },
    ],
    ticketOpacity: 0.24,
  },
} satisfies Record<string, DecorSpec>;

export type DecorVariant = keyof typeof DECOR;

export function Decor({ variant }: { variant: DecorVariant }) {
  const spec: DecorSpec = DECOR[variant];
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 390 852"
      preserveAspectRatio="xMidYMax slice"
      opacity={0.5}
    >
      <G stroke={colors.rose} strokeWidth={1.4} fill="none" opacity={spec.curveOpacity}>
        {spec.curves.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
      <G fill={colors.rose} opacity={spec.ticketOpacity}>
        {spec.tickets.map(({ x, y, w, h, rotate, rx = 3 }) => (
          <Rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={rx}
            transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}
          />
        ))}
      </G>
    </Svg>
  );
}

/** Cadre « billet perforé » : rayon 13, trait 2,6 pt, tirets irréguliers. */
export function TicketFrame({
  width,
  height,
  color,
  dash,
  dashOffset = 0,
}: {
  width: number;
  height: number;
  color: string;
  dash: string;
  dashOffset?: number;
}) {
  return (
    <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
      <Rect
        x={1.4}
        y={1.4}
        width={width - 2.8}
        height={height - 2.8}
        rx={13}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeDasharray={dash}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}
