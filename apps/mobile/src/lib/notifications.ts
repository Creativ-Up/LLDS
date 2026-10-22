import { isRunningInExpoGo } from 'expo';
import { PermissionsAndroid, Platform } from 'react-native';

// Expo Go (Android) n'embarque plus le module natif complet d'expo-notifications : le simple
// import du paquet y fait planter l'application. Il n'est donc chargé qu'en dehors d'Expo Go.
// (Expo Go 58 se déclare `executionEnvironment: "bare"` : on teste son module natif.)
const inExpoGoAndroid = Platform.OS === 'android' && isRunningInExpoGo();

/** Demande l'autorisation d'afficher des notifications ; `true` si elle est accordée. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (inExpoGoAndroid) {
    // Avant Android 13, aucune autorisation à demander.
    if (typeof Platform.Version === 'number' && Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const Notifications = await import('expo-notifications');
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}
