import { useFrame } from '@/theme/layout';

import { NETWORK_TOP } from '@/components/station-picker';

const ILLUSTRATION = { width: 390, height: 560 } as const;

/** Échelle de l'illustration du réseau : largeur de l'écran, réduite si la hauteur manque. */
export function useStationLayout() {
  const frame = useFrame();
  const top = frame.top(NETWORK_TOP);
  const available = frame.height - top - frame.insets.bottom;
  const scale = Math.min(1, frame.width / ILLUSTRATION.width, available / ILLUSTRATION.height);
  return { top, scale };
}
