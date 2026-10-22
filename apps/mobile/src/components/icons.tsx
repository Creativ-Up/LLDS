import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

// Pictogrammes dessinés en ligne dans la maquette (les icônes « fichier » sont dans @llds/assets).

export function ChevronLeft({ color = colors.red }: { color?: string }) {
  return (
    <Svg width={12} height={18} viewBox="0 0 12 18" fill="none">
      <Path d="M9.5 1.5 2 9l7.5 7.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowRight({ color = colors.cream }: { color?: string }) {
  return (
    <Svg width={26} height={18} viewBox="0 0 26 18" fill="none">
      <Path d="M1 9h23" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 2l7 7-7 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EyeIcon() {
  return (
    <Svg width={22} height={16} viewBox="0 0 22 16" fill="none">
      <Path d="M1 8s3.6-6.6 10-6.6S21 8 21 8s-3.6 6.6-10 6.6S1 8 1 8Z" stroke={colors.olive} strokeWidth={1.9} />
      <Circle cx={11} cy={8} r={3} stroke={colors.olive} strokeWidth={1.9} />
    </Svg>
  );
}

export function AlertIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={7.6} stroke={colors.redDeep} strokeWidth={2} />
      <Path d="M9 5v4.6M9 12.4v.2" stroke={colors.redDeep} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckMark({ color = colors.cream }: { color?: string }) {
  return (
    <Svg width={13} height={10} viewBox="0 0 13 10" fill="none">
      <Path d="M1.5 5.2 4.8 8.4 11.5 1.6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PinIcon({ crossed = false }: { crossed?: boolean }) {
  return (
    <Svg width={16} height={19} viewBox="0 0 16 19" fill="none">
      <Path d="M8 1.2c3.2 0 6 2.6 6 5.9 0 4.4-6 10.7-6 10.7S2 11.5 2 7.1C2 3.8 4.8 1.2 8 1.2Z" stroke={colors.olive} strokeWidth={1.7} />
      {crossed ? (
        <Path d="M1.5 1.5l13 16" stroke={colors.olive} strokeWidth={1.7} strokeLinecap="round" />
      ) : (
        <Circle cx={8} cy={7} r={2.2} stroke={colors.olive} strokeWidth={1.7} />
      )}
    </Svg>
  );
}

export function GuestIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 17 17" fill={colors.red}>
      <Circle cx={8.5} cy={5} r={3.4} />
      <Path d="M1.8 16c0-3.6 3-5.6 6.7-5.6s6.7 2 6.7 5.6z" />
    </Svg>
  );
}

export function ClockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={9.2} stroke={colors.olive} strokeWidth={2} />
      <Path d="M11 6.4v5.2l3.4 2" stroke={colors.olive} strokeWidth={2} />
    </Svg>
  );
}

export function DownloadIcon() {
  return (
    <Svg width={16} height={18} viewBox="0 0 16 18" fill="none">
      <Path d="M8 1.5v11" stroke={colors.cream} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l5 5 5-5" stroke={colors.cream} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 16.5h12" stroke={colors.cream} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DoneBadge() {
  return (
    <Svg width={28} height={28} viewBox="0 0 30 30" fill="none">
      <Circle cx={15} cy={15} r={15} fill={colors.red} />
      <Path d="M8.6 15.4l4.2 4.2 8.6-8.6" stroke={colors.white} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ScrollHint() {
  return (
    <Svg width={54} height={34} viewBox="0 0 54 34" fill="none">
      <Path d="M6 6l21 11L48 6" stroke={colors.ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 17l21 11 21-11" stroke={colors.ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EnvelopeIcon() {
  return (
    <Svg width={38} height={28} viewBox="0 0 38 28" fill="none">
      <Rect x={1.5} y={1.5} width={35} height={25} rx={3} stroke={colors.red} strokeWidth={2.6} strokeLinejoin="round" />
      <Path d="M2.5 3 19 16 35.5 3" stroke={colors.red} strokeWidth={2.6} strokeLinejoin="round" />
    </Svg>
  );
}

/** Bouton Paramètres de la carte. */
export function GearIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={3} stroke={colors.olive} strokeWidth={1.9} />
      <Path
        d="M10 1.4v2.2M10 16.4v2.2M18.6 10h-2.2M3.6 10H1.4M16.1 3.9l-1.6 1.6M5.5 14.5l-1.6 1.6M16.1 16.1l-1.6-1.6M5.5 5.5 3.9 3.9"
        stroke={colors.olive}
        strokeWidth={1.9}
      />
    </Svg>
  );
}

/** Bouton Cachets de la carte. */
export function StampsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={8} stroke={colors.olive} strokeWidth={1.8} />
      <Circle cx={10} cy={10} r={4.6} stroke={colors.olive} strokeWidth={1.8} strokeDasharray="3 2.4" />
    </Svg>
  );
}

/** Épingle blanche de la pastille d'arrivée. */
export function ArrivalPin() {
  return (
    <Svg width={16} height={19} viewBox="0 0 16 19" fill="none">
      <Path d="M8 1.2c3.2 0 6 2.6 6 5.9 0 4.4-6 10.7-6 10.7S2 11.5 2 7.1C2 3.8 4.8 1.2 8 1.2Z" stroke={colors.white} strokeWidth={2} />
      <Circle cx={8} cy={7} r={2.2} fill={colors.white} />
    </Svg>
  );
}

export function CloseCross({ size = 9, color = colors.olive }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path d="M1 1l12 12M13 1L1 13" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

/** Modes vélo et voiture de la consigne de guidage (crème, comme le marcheur `mode-pied.svg`). */
export function BikeModeIcon() {
  return (
    <Svg width={14.7} height={12.586} viewBox="0 0 28 23.917" fill={colors.cream} opacity={0.72}>
      <Path d="M 18.083 4.667 C 19.367 4.667 20.417 3.617 20.417 2.333 C 20.417 1.05 19.367 0 18.083 0 C 16.8 0 15.75 1.05 15.75 2.333 C 15.75 3.617 16.8 4.667 18.083 4.667 Z M 5.833 23.917 C 9.1 23.917 11.667 21.35 11.667 18.083 C 11.667 14.817 9.1 12.25 5.833 12.25 C 2.567 12.25 0 14.817 0 18.083 C 0 21.35 2.567 23.917 5.833 23.917 Z M 5.833 14 C 8.05 14 9.917 15.867 9.917 18.083 C 9.917 20.3 8.05 22.167 5.833 22.167 C 3.617 22.167 1.75 20.3 1.75 18.083 C 1.75 15.867 3.617 14 5.833 14 Z M 9.1 11.317 L 12.833 14.583 L 12.833 20.417 L 15.167 20.417 L 15.167 13.183 L 12.6 10.5 L 15.4 7.7 L 16.333 8.633 C 17.85 10.15 19.833 11.083 22.283 11.083 L 22.283 8.75 C 20.533 8.75 19.133 8.05 18.083 7 L 15.867 4.783 C 15.283 4.317 14.7 4.083 14 4.083 C 13.3 4.083 12.717 4.317 12.367 4.783 L 9.1 8.05 C 8.633 8.517 8.4 9.1 8.4 9.683 C 8.4 10.383 8.633 10.967 9.1 11.317 Z M 22.167 12.25 C 18.9 12.25 16.333 14.817 16.333 18.083 C 16.333 21.35 18.9 23.917 22.167 23.917 C 25.433 23.917 28 21.35 28 18.083 C 28 14.817 25.433 12.25 22.167 12.25 Z M 22.167 22.167 C 19.95 22.167 18.083 20.3 18.083 18.083 C 18.083 15.867 19.95 14 22.167 14 C 24.383 14 26.25 15.867 26.25 18.083 C 26.25 20.3 24.383 22.167 22.167 22.167 Z" />
    </Svg>
  );
}

export function CarModeIcon() {
  return (
    <Svg width={14.3} height={12.586} viewBox="0 0 25.23 22.203" fill={colors.cream} opacity={0.72}>
      <Path d="M 21.813 0.772 C 22.153 1.113 24.87 8.988 24.986 9.867 C 25.288 12.153 25.314 18.467 25.039 20.758 C 24.989 21.176 25.054 21.656 24.655 21.933 L 21.18 22.049 L 20.515 19.362 L 4.377 19.375 C 4.872 22.22 2.483 22.731 0.262 21.737 C -0.079 21.251 -0.045 11.154 0.125 9.867 C 0.247 8.938 2.999 1.07 3.392 0.67 C 3.772 0.282 4.071 0.326 4.549 0.27 C 8.041 -0.144 16.172 -0.033 19.778 0.276 C 20.381 0.327 21.384 0.343 21.811 0.774 L 21.813 0.772 Z M 2.819 8.469 L 22.294 8.469 L 20.392 2.463 L 19.778 2.211 L 4.806 2.278 L 2.819 8.469 Z M 4.268 11.266 C 1.821 11.982 2.847 15.785 5.262 15.416 C 8.107 14.981 7.216 10.404 4.268 11.266 Z M 19.451 11.259 C 17.267 11.922 17.892 15.808 20.452 15.416 C 23.348 14.972 22.48 10.339 19.451 11.259 Z" />
    </Svg>
  );
}

/** Repères de la charte (croix, double croissant, losange), posés autour des cadres. */
export function CrossMark({ size = 10 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M1 1l8 8M9 1l-8 8" stroke={colors.red} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

export function CrescentsMark() {
  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" fill={colors.red}>
      <Path d="M1 0c4 2 4 10 0 12 5 0 7-3 7-6S6 0 1 0z" />
      <Path d="M8 0c4 2 4 10 0 12 5 0 7-3 7-6s-2-6-7-6z" />
    </Svg>
  );
}

export function DiamondMark() {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14" fill={colors.red}>
      <Path d="M4 0l4 7-4 7-4-7z" />
    </Svg>
  );
}
