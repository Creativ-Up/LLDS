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
