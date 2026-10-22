import type { ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors, interFamily, textStyle } from '@/theme';
import { letterSpacingPt } from '@llds/shared/tokens';

interface TextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

/** Titre d'écran : 600, 32–34 pt, interligne 1,14, approche −0,025 em. */
export function Title({ children, style, size = 32 }: TextProps & { size?: number }) {
  return (
    <Text accessibilityRole="header" style={[styles.title, { fontSize: size, letterSpacing: letterSpacingPt(-0.025, size) }, style]}>
      {children}
    </Text>
  );
}

/** Sous-titre : 400, 16 pt, olive. */
export function Subtitle({ children, style }: TextProps) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

/** Libellé de section : 500, 13 pt, approche 0,07 em, capitales, olive. */
export function Label({ children, style }: TextProps) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

/** Texte courant (corps). */
export function Body({ children, style }: TextProps) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

/** Graisse 600 dans un texte courant (balise <b> des traductions). */
export function Strong({ children }: { children?: ReactNode }) {
  return <Text style={styles.strong}>{children}</Text>;
}

export const styles = StyleSheet.create({
  title: {
    fontFamily: interFamily(600),
    lineHeight: 32 * 1.14,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: interFamily(400),
    fontSize: 16,
    lineHeight: 16 * 1.35,
    color: colors.olive,
  },
  label: {
    ...textStyle('label'),
    lineHeight: 13,
    color: colors.olive,
  },
  body: {
    fontFamily: interFamily(400),
    fontSize: 15,
    lineHeight: 15 * 1.45,
    color: colors.ink,
  },
  strong: {
    fontFamily: interFamily(600),
  },
});
