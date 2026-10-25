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
  unregister: () => Promise<void>;
  configureCategories: (categories: string[]) => Promise<void>;
  getInitialNotification: () => Promise<OpenedNotification | null>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

const nativePush = NativeModules.RediNotifications as NativePushModule | undefined;
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

export async function syncPushDevice(_account?: AccountRepository, _installationId?: string): Promise<void> {
  // The learner API has no device-token registration route.
}

export async function unregisterPushDevice(account: AccountRepository): Promise<void> {
  const installationId = await getPushInstallationId();
  if (!installationId) return;
  await account.unregisterPushDevice(installationId);
  await nativePush?.unregister();
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
  const emitter = new NativeEventEmitter(NativeModules.RediNotifications);
  const openSub = emitter.addListener('notificationOpened', payload => onOpen(payload as unknown as OpenedNotification));
  const tokenSub = emitter.addListener('pushTokenChanged', token => onToken(String(token)));
  return () => {
    openSub.remove();
    tokenSub.remove();
  };
}
