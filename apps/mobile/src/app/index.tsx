import { Redirect } from 'expo-router';

import { usePreferences } from '@/features/preferences/preferences';

/**
 * Point d'entrée : l'onboarding n'est montré qu'au premier lancement ;
 * ensuite, une ligne en cours rouvre directement la carte (docs/BEHAVIOR.md § Navigation).
 */
export default function Index() {
  const { preferences } = usePreferences();
  if (preferences.onboarded && preferences.lineId) return <Redirect href="/carte" />;
  if (preferences.onboarded) return <Redirect href="/lignes" />;
  return <Redirect href="/accueil" />;
}
