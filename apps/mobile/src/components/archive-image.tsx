import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, FeColorMatrix, Filter, Image } from 'react-native-svg';

import { colors } from '@/theme';

// Les cartes postales et couvertures s'affichent en niveaux de gris + sépia 0,22 + contraste 0,96
// (filtres CSS du prototype). React Native n'a pas de filtres CSS : matrice de couleurs SVG équivalente.

const LUMA = [0.2126, 0.7152, 0.0722] as const;
const SEPIA_ROW_SUMS = [1.351, 1.203, 0.937] as const;

function archiveMatrix(sepia: number, contrast: number): string {
  const rows = SEPIA_ROW_SUMS.map((sum) => {
    const gain = (1 - sepia + sepia * sum) * contrast;
    return [...LUMA.map((weight) => weight * gain), 0, (1 - contrast) / 2];
  });
  return [...rows.flat(), 0, 0, 0, 1, 0].map((value) => value.toFixed(5)).join(' ');
}

const ARCHIVE_MATRIX = archiveMatrix(0.22, 0.96);
const GRAYSCALE_MATRIX = archiveMatrix(0, 1);

interface ArchiveImageProps {
  uri: string | null;
  width: number;
  height: number;
  /** archive : gris + sépia (cartes postales) ; grayscale : gris seul (Accueil). */
  tone?: 'archive' | 'grayscale';
  /** Cadrage : 'xMidYMid slice' (couvrir) par défaut. */
  preserveAspectRatio?: string;
  style?: StyleProp<ViewStyle>;
}

export function ArchiveImage({
  uri,
  width,
  height,
  tone = 'archive',
  preserveAspectRatio = 'xMidYMid slice',
  style,
}: ArchiveImageProps) {
  const filterId = `archive-${useId().replace(/:/g, '')}`;
  return (
    <View style={[styles.frame, { width, height }, style]}>
      {uri && (
        <Svg width={width} height={height}>
          <Defs>
            <Filter id={filterId}>
              <FeColorMatrix type="matrix" values={tone === 'archive' ? ARCHIVE_MATRIX : GRAYSCALE_MATRIX} />
            </Filter>
          </Defs>
          <Image
            href={{ uri }}
            width={width}
            height={height}
            preserveAspectRatio={preserveAspectRatio}
            filter={`url(#${filterId})`}
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.photoBg,
  },
});
