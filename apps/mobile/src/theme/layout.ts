import { layout } from '@llds/shared/tokens';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Base de la maquette : 390 × 852 pt (iPhone 14/15), barre d'état 47 pt et indicateur d'accueil 34 pt.
 * Les ordonnées de la maquette sont converties par rapport aux zones sûres réelles de l'appareil :
 * les éléments du haut suivent la barre d'état, ceux du bas restent ancrés au bas de la zone sûre.
 */
export const DESIGN = {
  width: layout.baseWidth,
  height: layout.baseHeight,
  statusBar: 47,
  homeIndicator: 34,
  side: layout.sideMargin,
} as const;

export interface Frame {
  width: number;
  height: number;
  /** Ordonnée de la maquette (depuis le haut de l'écran) → position réelle. */
  top: (designY: number) => number;
  /** Distance au bas de l'écran dans la maquette → position réelle. */
  bottom: (designBottom: number) => number;
  /** Largeur du contenu entre les marges latérales fixes. */
  contentWidth: number;
  insets: { top: number; bottom: number };
}

export function useFrame(): Frame {
  const insets = useSafeAreaInsets();
  // Zone réellement dessinée (bord à bord) : sur Android, la fenêtre exclut la barre d'état.
  const { width, height } = useSafeAreaFrame();
  const safeBottom = Math.max(insets.bottom, 12);
  return {
    width,
    height,
    top: (designY) => insets.top + designY - DESIGN.statusBar,
    bottom: (designBottom) => safeBottom + designBottom - DESIGN.homeIndicator,
    contentWidth: width - 2 * DESIGN.side,
    insets: { top: insets.top, bottom: safeBottom },
  };
}
