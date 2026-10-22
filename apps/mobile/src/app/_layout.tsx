import '@/lib/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/auth';
import { PreferencesProvider } from '@/features/preferences/preferences';
import { colors, fontAssets } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { ready } = useAuth();
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
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
