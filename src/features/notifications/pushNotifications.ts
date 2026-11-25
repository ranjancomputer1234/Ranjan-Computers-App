import {NativeEventEmitter, NativeModules, Platform} from 'react-native';
import {appConfig} from '../../core/config';
import type {AccountRepository} from '../../core/repositories';
import type {ContentKind, ContentRef, NotificationCategory} from '../../core/types';
import {usePreferencesStore} from '../settings/preferencesStore';

export type OpenedNotification = {
  notificationId: string;
  category: NotificationCategory;
  targetKind?: ContentKind;
  targetId?: string;
};

type NativePushModule = {
  isSupported: () => Promise<boolean>;
  getInstallationId: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
  unregister: () => Promise<void>;
  configureCategories: (categories: string[]) => Promise<void>;
  getInitialNotification: () => Promise<OpenedNotification | null>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

const nativePush = NativeModules.RaciNotifications as NativePushModule | undefined;
const contentKinds = new Set<ContentKind>([
  'course', 'lesson', 'test', 'news', 'fact', 'topic', 'interviewQuestion',
  'interviewCategory', 'liveClass', 'document', 'exam', 'section',
]);

export function pushIsConfigured(): boolean {
  return Platform.OS === 'android' && appConfig.pushProvider === 'fcm' && Boolean(nativePush);
}

export function enabledNotificationCategories(): Exclude<NotificationCategory, 'system'>[] {
  const prefs = usePreferencesStore.getState();
  return [
    prefs.notifClasses && 'classes',
    prefs.notifTests && 'tests',
    prefs.notifNews && 'news',
    prefs.notifOffers && 'offers',
  ].filter(Boolean) as Exclude<NotificationCategory, 'system'>[];
}

export async function getPushInstallationId(): Promise<string | null> {
  if (!pushIsConfigured() || !nativePush) return null;
  try {
    return await nativePush.getInstallationId();
  } catch {
    return null;
  }
}

export async function getFcmToken(): Promise<string | null> {
  if (!pushIsConfigured() || !nativePush?.getToken) return null;
  try {
    const token = (await nativePush.getToken())?.trim();
    return token && token.length >= 8 ? token : null;
  } catch {
    return null;
  }
}

/** Guest register before login. After login, attach the same FCM token to the learner. */
export async function syncPushDevice(account?: AccountRepository, knownToken?: string): Promise<void> {
  if (!account || !pushIsConfigured() || !nativePush) return;
  const token = (knownToken?.trim() || (await getFcmToken()) || '').trim();
  if (token.length < 8) return;
  const categories = enabledNotificationCategories();
  try {
    await nativePush.configureCategories(categories);
  } catch {
    // Channel setup is local. Registration with the API still proceeds.
  }
  const installationId = await getPushInstallationId();
  const prefs = usePreferencesStore.getState();
  await account.registerPushDevice({
    token,
    ...(installationId ? {installationId} : {}),
    provider: 'fcm',
    platform: 'android',
    appVersion: appConfig.versionName,
    locale: 'en-IN',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    categories,
    notifClasses: prefs.notifClasses,
    notifTests: prefs.notifTests,
    notifNews: prefs.notifNews,
    notifOffers: prefs.notifOffers,
  });
}

export async function unregisterPushDevice(account: AccountRepository): Promise<void> {
  const token = await getFcmToken();
  if (!token) return;
  await account.unregisterPushDevice(token);
}

export async function getInitialNotification(): Promise<OpenedNotification | null> {
  if (!nativePush) return null;
  try {
    return await nativePush.getInitialNotification();
  } catch {
    return null;
  }
}

export function openedNotificationTarget(payload: OpenedNotification): ContentRef | undefined {
  if (!payload.targetKind || !payload.targetId || !contentKinds.has(payload.targetKind)) return undefined;
  return {kind: payload.targetKind, id: payload.targetId};
}

export function subscribeToNotificationEvents(
  onOpen: (payload: OpenedNotification) => void,
  onToken: (token: string) => void,
): () => void {
  if (!nativePush) return () => {};
  const emitter = new NativeEventEmitter(NativeModules.RaciNotifications);
  const openSub = emitter.addListener('notificationOpened', payload => onOpen(payload as unknown as OpenedNotification));
  const tokenSub = emitter.addListener('pushTokenChanged', token => onToken(String(token)));
  return () => {
    openSub.remove();
    tokenSub.remove();
  };
}
