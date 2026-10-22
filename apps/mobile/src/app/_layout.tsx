import '@/lib/i18n';
// Tâche de géofencing définie dès le démarrage : le système peut réveiller l'application pour une arrivée.
import '@/features/map/geofencing';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerDevMenuItems } from 'expo-dev-menu';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthProvider, useAuth } from '@/features/auth/auth';
import { PreferencesProvider } from '@/features/preferences/preferences';
import { setupArrivalNotifications } from '@/lib/notifications';
import { colors, fontAssets } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { ready } = useAuth();
  const { t } = useTranslation();
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  useEffect(() => {
    void setupArrivalNotifications(t('map.notificationChannel'));
    // Build de développement : menu développeur (simulation de position) depuis le menu Expo.
    if (__DEV__) void registerDevMenuItems([{ name: t('dev.title'), callback: () => router.push('/dev') }]);
  }, [t]);
  if (!ready) return null;
  // Pile sans barre d'onglets ; chaque écran gère son entrée animée (`in`).
  return <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.cream } }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Navigator />
        </AuthProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
