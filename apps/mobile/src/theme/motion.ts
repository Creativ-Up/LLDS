import { motion } from '@llds/shared/tokens';
import { Easing, Keyframe, ReduceMotion } from 'react-native-reanimated';

// Animations du prototype (docs/BEHAVIOR.md § Animations). Les durées viennent des tokens ;
// « Réduire les animations » (système) les désactive.

const [x1, y1, x2, y2] = motion.easing;
export const lldsEasing = Easing.bezier(x1, y1, x2, y2);
export const lldsEasingFn = Easing.bezierFn(x1, y1, x2, y2);

/** `in` : entrée d'écran — opacité 0 → 1, translation 10 → 0. */
export const screenIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 10 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: lldsEasing },
})
  .duration(motion.screenIn)
  .reduceMotion(ReduceMotion.System);

/** `pop` : sélections, badges — échelle 0,6 → 1,08 → 1, opacité 0 → 1. */
export const pop = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.6 }] },
  60: { opacity: 1, transform: [{ scale: 1.08 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
})
  .duration(motion.pop)
  .reduceMotion(ReduceMotion.System);

/** `up` : feuilles du bas — opacité 0 → 1, translation 60 → 0. */
export const sheetUp = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 60 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: lldsEasing },
})
  .duration(motion.sheetUp)
  .reduceMotion(ReduceMotion.System);

/** Délai avant le passage automatique à l'écran suivant après un choix. */
export const AUTO_ADVANCE_MS = motion.autoAdvance;
