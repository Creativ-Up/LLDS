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

// ── Arrivées aux arrêts ─────────────────────────────────────────────────────

const ARRIVAL_CHANNEL = 'arrivals';
/** Deux secousses, comme le bandeau d'arrivée (BEHAVIOR.md). */
const ARRIVAL_VIBRATION = [0, 250, 150, 250];

export interface ArrivalNotice {
  stopId: string;
  title: string;
  body: string;
}

/** Une notification par arrêt : une seconde alerte pour le même arrêt remplace la première. */
const arrivalId = (stopId: string) => `arrival:${stopId}`;

async function notifications() {
  return inExpoGoAndroid ? null : import('expo-notifications');
}

/**
 * Prépare l'affichage des notifications d'arrivée : canal Android (priorité haute, vibration) et,
 * application ouverte, pas de bannière système (la carte affiche son propre bandeau).
 */
export async function setupArrivalNotifications(channelName: string): Promise<void> {
  const Notifications = await notifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ARRIVAL_CHANNEL, {
      name: channelName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: ARRIVAL_VIBRATION,
    });
  }
}

/** Notification d'arrivée immédiate (application fermée ou en arrière-plan). */
export async function notifyArrival({ stopId, title, body }: ArrivalNotice): Promise<void> {
  const Notifications = await notifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    identifier: arrivalId(stopId),
    content: { title, body, data: { stopId }, vibrate: ARRIVAL_VIBRATION },
    trigger: Platform.OS === 'android' ? { channelId: ARRIVAL_CHANNEL } : null,
  });
}

/** Notification d'arrivée programmée (trajet simulé poursuivi application en arrière-plan). */
export async function scheduleArrival({ stopId, title, body }: ArrivalNotice, at: Date): Promise<void> {
  const Notifications = await notifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    identifier: arrivalId(stopId),
    content: { title, body, data: { stopId }, vibrate: ARRIVAL_VIBRATION },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: ARRIVAL_CHANNEL },
  });
}

/** Annule les arrivées programmées (retour au premier plan : la carte reprend la main). */
export async function cancelScheduledArrivals(): Promise<void> {
  const Notifications = await notifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Arrêt visé par la notification d'arrivée touchée pour ouvrir l'application. */
export function arrivalStopId(data: Record<string, unknown> | null | undefined): string | null {
  return typeof data?.stopId === 'string' ? data.stopId : null;
}
