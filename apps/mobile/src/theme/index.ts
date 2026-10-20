import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_500Medium_Italic,
  Inter_600SemiBold,
  Inter_600SemiBold_Italic,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { letterSpacingPt, lineHeightPt, typography, type TypographyToken } from '@llds/shared/tokens';
import type { TextStyle } from 'react-native';

export { colors, layout, motion, radius, stroke } from '@llds/shared/tokens';

/** Fichiers de police Inter chargés au démarrage (graisses et italiques des tokens). */
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_500Medium_Italic,
  Inter_600SemiBold,
  Inter_600SemiBold_Italic,
  Inter_700Bold,
};

type FontFamily = keyof typeof fontAssets;

const ROMAN: Record<number, FontFamily> = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
};

const ITALIC: Record<number, FontFamily> = {
  500: 'Inter_500Medium_Italic',
  600: 'Inter_600SemiBold_Italic',
};

/** Famille Inter correspondant à une graisse (les polices chargées portent leur graisse). */
export function interFamily(weight: number, italic = false): FontFamily {
  return (italic ? ITALIC[weight] : ROMAN[weight]) ?? 'Inter_400Regular';
}

/** Style de texte React Native calculé depuis un style typographique des tokens. */
export function textStyle(token: TypographyToken): TextStyle {
  const style = typography[token];
  return {
    fontFamily: interFamily(style.weight),
    fontSize: style.size,
    ...('lineHeight' in style && { lineHeight: lineHeightPt(style.lineHeight, style.size) }),
    ...('letterSpacing' in style && { letterSpacing: letterSpacingPt(style.letterSpacing, style.size) }),
    ...('uppercase' in style && style.uppercase && { textTransform: 'uppercase' as const }),
  };
}
