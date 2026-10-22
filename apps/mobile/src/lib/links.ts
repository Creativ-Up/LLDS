import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

/** Lien qui rouvre l'application sur `path` (liens envoyés par e-mail). */
export function appLink(path: `/${string}`): string {
  // Expo Go 58 se déclare « bare » : expo-linking y produit un lien `llds://` qu'Expo Go
  // n'ouvre pas. On vise alors directement le projet servi par Metro (`exp://hôte/--/chemin`).
  const hostUri = Constants.expoConfig?.hostUri;
  if (isRunningInExpoGo() && hostUri) return `exp://${hostUri}/--${path}`;
  return Linking.createURL(path);
}
