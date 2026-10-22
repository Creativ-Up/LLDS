import { letterSpacingPt, stroke } from '@llds/shared/tokens';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { colors, interFamily } from '@/theme';

// Plan de ligne : trait 3 pt encre, un point par arrêt réparti sur la largeur (point 15 pt ;
// visité = rouge plein ; à venir = crème contour 3 pt). Au-delà de 16 arrêts : points de 11 pt ;
// au-delà de 24 : barre de progression graduée.

const DOT = { regular: 15, small: 11 } as const;
const DENSE = 16;
const GRADUATED = 24;
const LABEL_MARGIN = 70;

interface LinePlanProps {
  width: number;
  /** Nombre d'arrêts, dans le sens de parcours choisi. */
  count: number;
  /** Arrêts visités (les premiers dans l'ordre du parcours). */
  visited: number;
  fromLabel: string;
  toLabel: string;
  /** Prochain arrêt (ligne en cours), libellé en rouge sous son point. */
  currentLabel?: string;
}

export function LinePlan({ width, count, visited, fromLabel, toLabel, currentLabel }: LinePlanProps) {
  const dot = count > DENSE ? DOT.small : DOT.regular;
  const pad = DOT.regular / 2;
  const span = width - 2 * pad;
  const xs = Array.from({ length: count }, (_, i) => pad + (count > 1 ? (i * span) / (count - 1) : span / 2));
  const currentX = currentLabel !== undefined ? xs[visited] : undefined;
  const showCurrent = currentX !== undefined && currentX > LABEL_MARGIN && currentX < width - LABEL_MARGIN;

  return (
    <View style={{ width, height: 56 }}>
      {count > GRADUATED ? (
        <Svg width={width} height={15}>
          <Line x1={pad} y1={7.5} x2={width - pad} y2={7.5} stroke={colors.ink} strokeWidth={stroke.linePlan} />
          <Rect x={pad} y={5} width={(span * visited) / Math.max(count - 1, 1)} height={5} fill={colors.red} />
          {xs.map((x) => (
            <Line key={x} x1={x} y1={3} x2={x} y2={12} stroke={colors.ink} strokeWidth={1} />
          ))}
        </Svg>
      ) : (
        <>
          <View style={[styles.track, { left: 7, right: 7 }]} />
          {xs.map((x, i) => (
            <View
              key={x}
              style={[
                styles.dot,
                {
                  left: x - dot / 2,
                  top: (DOT.regular - dot) / 2,
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                },
                i < visited ? styles.dotVisited : styles.dotUpcoming,
              ]}
            />
          ))}
        </>
      )}
      <Text style={[styles.label, { left: 0 }]}>{fromLabel}</Text>
      <Text style={[styles.label, { right: 0 }]}>{toLabel}</Text>
      {showCurrent && (
        <Text style={[styles.label, styles.current, { left: currentX - 60, width: 120 }]}>{currentLabel}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    top: 6,
    height: stroke.linePlan,
    backgroundColor: colors.ink,
  },
  dot: {
    position: 'absolute',
  },
  dotVisited: {
    backgroundColor: colors.red,
  },
  dotUpcoming: {
    backgroundColor: colors.cream,
    borderWidth: stroke.linePlan,
    borderColor: colors.ink,
  },
  label: {
    position: 'absolute',
    top: 28,
    fontFamily: interFamily(700),
    fontSize: 11.5,
    lineHeight: 11.5,
    letterSpacing: letterSpacingPt(0.08, 11.5),
    color: colors.ink,
    textTransform: 'uppercase',
  },
  current: {
    color: colors.red,
    textAlign: 'center',
  },
});
