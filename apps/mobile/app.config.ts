import type { ExpoConfig } from 'expo/config';

import tokens from '../../tokens/tokens.json';

// Couleurs natives (splash, fond système, icône Android) issues des tokens LLDS.
const config: ExpoConfig = {
  name: 'Les lignes du souvenir',
  slug: 'llds',
  version: '0.1.0',
  // Application mobile uniquement : pas de cible web.
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'llds',
  userInterfaceStyle: 'light',
  backgroundColor: tokens.color.cream,
  ios: {
    bundleIdentifier: 'be.creativup.llds',
    icon: './assets/expo.icon',
    supportsTablet: false,
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
    },
  },
  android: {
    package: 'be.creativup.llds',
    adaptiveIcon: {
      backgroundColor: tokens.color.cream,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: tokens.color.cream,
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-sqlite',
    'expo-localization',
    [
      'expo-location',
      {
        // Textes des boîtes système : voir locales/*.json (FR, NL, EN).
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    'expo-notifications',
    // Carte sans tuiles (fond crème + GeoJSON) : moteur OpenGL et localisation par défaut.
    '@maplibre/maplibre-react-native',
    // Build Android sous Windows : CMake récent, dont le ninja gère les chemins longs.
    './plugins/with-long-path-cmake.js',
  ],
  // Textes natifs traduits (boîtes d'autorisation iOS).
  locales: {
    fr: './locales/fr.json',
    nl: './locales/nl.json',
    en: './locales/en.json',
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
