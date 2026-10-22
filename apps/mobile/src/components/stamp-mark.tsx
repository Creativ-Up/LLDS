import type { Media } from '@llds/shared';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useMediaUrl } from '@/features/content/queries';
import { colors } from '@/theme';

/**
 * Cachet : image fournie (PNG transparent) ou cachet générique
 * (cercle sépia + cercle intérieur en pointillés + coche, cf. README « Images des cachets »).
 */
export function StampMark({ image, size, style }: { image: Media | null | undefined; size: number; style?: StyleProp<ImageStyle & ViewStyle> }) {
  const url = useMediaUrl(image);
  if (image && url) {
    return <Image source={{ uri: url }} resizeMode="contain" style={[{ width: size, height: size }, style]} />;
  }
  return (
    <View style={[styles.generic, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle cx={20} cy={20} r={18.5} fill="none" stroke={colors.sepia} strokeWidth={2.4} />
        <Circle cx={20} cy={20} r={13} fill="none" stroke={colors.sepia} strokeWidth={1.4} strokeDasharray="2.4 1.8" />
        <Path d="M14.5 20.4l3.6 3.6 7.6-7.8" fill="none" stroke={colors.sepia} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  generic: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
