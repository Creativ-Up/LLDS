import { useEffect, useRef } from 'react';

import { AUTO_ADVANCE_MS } from '@/theme/motion';

/** Après un choix (halo animé), passage automatique à l'écran suivant après 380 ms. */
export function useAutoAdvance() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (next: () => void, delay: number = AUTO_ADVANCE_MS) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(next, delay);
  };
}
