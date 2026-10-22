import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { colors } from '@/theme';
import { pop } from '@/theme/motion';

// Illustration du réseau (écrans Langue et Transport) : coordonnées de la maquette (390 × 560),
// posée en y = 250 ; les trois « gares » 72 × 72 sont en x = 160, y = 276 / 416 / 557.

const ILLUSTRATION = { width: 390, height: 560, top: 250 } as const;
const STATION_SIZE = 72;
const STATIONS = [
  { x: 160, y: 26, dash: '96 22 48 48', dashOffset: 0 },
  { x: 160, y: 166, dash: '64 20 80 30', dashOffset: 40 },
  { x: 160, y: 307, dash: '50 22 92 34', dashOffset: 84 },
] as const;

export const NETWORK_TOP = ILLUSTRATION.top;

function NetworkLines() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${ILLUSTRATION.width} ${ILLUSTRATION.height}`} fill="none">
      <G stroke={colors.ink} strokeWidth={4.5} strokeLinecap="round" fill="none">
        <Path d="M 85 202 L 85 78 Q 85 62 101 62 L 160 62" />
        <Path d="M 232 62 L 340 62 Q 356 62 356 78 L 356 395 Q 356 411 340 411 L 250 411" />
        <Path d="M 196 98 L 196 166" />
        <Path d="M 196 238 L 196 307" />
        <Path d="M 85 202 L 160 202" />
        <Path d="M 85 202 L 50 202 Q 34 202 34 218 L 34 246" />
        <Path d="M 232 343 L 356 343" />
      </G>
      <G stroke={colors.ink} strokeWidth={4.5} strokeLinecap="round" strokeDasharray="1.5 13" fill="none">
        <Path d="M 34 276 L 34 372" />
        <Path d="M 150 411 L 214 411" />
      </G>
      <G stroke={colors.red} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.9}>
        <Path d="M 52 60 Q 72 40 96 44" />
        <Path d="M 20 250 L 20 296" />
        <Path d="M 246 372 L 306 372" />
      </G>
      <Circle cx={85} cy={140} r={7} fill={colors.red} />
      <Circle cx={85} cy={202} r={6} fill={colors.cream} stroke={colors.ink} strokeWidth={3.4} />
      <Circle cx={272} cy={62} r={7.5} fill={colors.red} />
      <Circle cx={356} cy={170} r={6} fill={colors.cream} stroke={colors.ink} strokeWidth={3.4} />
      <Circle cx={356} cy={208} r={6} fill={colors.cream} stroke={colors.ink} strokeWidth={3.4} />
      <Circle cx={340} cy={343} r={7.5} fill={colors.red} />
      <Circle cx={326} cy={411} r={7.5} fill={colors.red} />
      <Circle cx={272} cy={411} r={6} fill={colors.cream} stroke={colors.ink} strokeWidth={3.4} />
      <G transform="translate(100 17)" stroke={colors.red} strokeWidth={2.6} strokeLinecap="round">
        <Path d="M1 1l8 8M9 1l-8 8" />
      </G>
      <G transform="translate(292 32)" fill={colors.red}>
        <Path d="M1 0c4 2 4 10 0 12 5 0 7-3 7-6S6 0 1 0z" />
        <Path d="M8 0c4 2 4 10 0 12 5 0 7-3 7-6s-2-6-7-6z" />
      </G>
    </Svg>
  );
}

export interface StationOption<T extends string> {
  value: T;
  label: string;
  content: ReactNode;
}

interface StationPickerProps<T extends string> {
  options: readonly [StationOption<T>, StationOption<T>, StationOption<T>];
  selected: T | undefined;
  onPick: (value: T) => void;
  /** Mise à l'échelle (largeur ou hauteur disponible / maquette). */
  scale: number;
  top: number;
}

/** Choix par « gare » : cercle 72 crème, anneau rouge 4 pt en pointillés irréguliers, halo animé. */
export function StationPicker<T extends string>({ options, selected, onPick, scale, top }: StationPickerProps<T>) {
  return (
    <View
      style={[
        styles.illustration,
        { top, width: ILLUSTRATION.width * scale, height: ILLUSTRATION.height * scale },
      ]}
    >
      <NetworkLines />
      {options.map((option, index) => {
        const station = STATIONS[index];
        if (!station) return null;
        const size = STATION_SIZE * scale;
        return (
          <View
            key={option.value}
            style={[styles.station, { left: station.x * scale, top: station.y * scale, width: size, height: size }]}
          >
            {selected === option.value && (
              <Animated.View entering={pop} pointerEvents="none" style={[styles.halo, { borderRadius: size / 2 + 6 }]} />
            )}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === option.value }}
              accessibilityLabel={option.label}
              onPress={() => onPick(option.value)}
              style={({ pressed }) => [
                styles.disc,
                { borderRadius: size / 2, transform: [{ scale: pressed ? 1.06 : 1 }] },
              ]}
            >
              {option.content}
            </Pressable>
            <Svg pointerEvents="none" width={size} height={size} viewBox="0 0 72 72" style={StyleSheet.absoluteFill}>
              <Circle
                cx={36}
                cy={36}
                r={34}
                fill="none"
                stroke={colors.red}
                strokeWidth={4}
                strokeDasharray={station.dash}
                strokeDashoffset={station.dashOffset}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  illustration: {
    position: 'absolute',
    alignSelf: 'center',
  },
  station: {
    position: 'absolute',
  },
  disc: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderWidth: 6,
    borderColor: colors.haloRed,
  },
});
