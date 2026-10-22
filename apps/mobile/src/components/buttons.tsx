import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, interFamily, radius, stroke, textStyle } from '@/theme';

import { ArrowRight } from './icons';

interface ButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** 53 (Accueil), 56 (formulaires), 52 (« Continuer sans compte ») */
  height?: number;
}

/** Bouton rouge plein : appui `redDeep`. */
export function RedButton({ label, onPress, style, disabled, height = 56 }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, { height }, { backgroundColor: pressed ? colors.redDeep : colors.red }, style]}
    >
      <Text style={[styles.label, { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

/** Bouton contour rouge : fond crème, contour intérieur 2 pt, appui `redTint`. */
export function OutlineButton({ label, onPress, style, height = 53 }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.outline,
        { height, backgroundColor: pressed ? colors.redTint : colors.cream },
        style,
      ]}
    >
      <Text style={[styles.label, { color: colors.red }]}>{label}</Text>
    </Pressable>
  );
}

/** CTA olive : 60 pt, rayon 8, capitales, flèche à droite ; appui `oliveDark`. */
export function OliveCta({ label, onPress, style, disabled }: Omit<ButtonProps, 'height'>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.cta, { backgroundColor: pressed ? colors.oliveDark : colors.olive }, style]}
    >
      {/* Libellé ajusté s'il dépasse (Inter statique un peu plus large que dans la maquette, libellés NL / EN). */}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={styles.ctaLabel}>
        {label}
      </Text>
      <ArrowRight />
    </Pressable>
  );
}

interface LinkProps {
  children: ReactNode;
  onPress: () => void;
  color?: string;
  size?: number;
  weight?: 400 | 500;
  style?: StyleProp<ViewStyle>;
}

/** Lien souligné (décalage 3) avec zone tactile ≥ 44 pt. */
export function TextLink({ children, onPress, color = colors.olive, size = 15, weight = 400, style }: LinkProps) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={12} style={[styles.link, style]}>
      {({ pressed }) => (
        // Android : un soulignement n'est redessiné qu'au montage du texte (cf. Checkbox).
        <Text
          key={pressed ? 'pressed' : 'idle'}
          style={{
            fontFamily: interFamily(weight),
            fontSize: size,
            lineHeight: size * 1.2,
            color: pressed ? colors.oliveText : color,
            textDecorationLine: 'underline',
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: stroke.control,
    borderColor: colors.red,
  },
  label: {
    ...textStyle('button'),
  },
  cta: {
    height: 60,
    borderRadius: radius.cta,
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLabel: {
    ...textStyle('cta'),
    color: colors.cream,
    flexShrink: 1,
    marginRight: 6,
  },
  link: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
