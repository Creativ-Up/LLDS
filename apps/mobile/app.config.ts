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
    icon: './assets/expo.icon',
    supportsTablet: false,
  },
  android: {
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
