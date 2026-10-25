import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
  type AppStateStatus,
} from 'react-native';
import type {LiveClass} from '../../core/types';
import {getPreference, setPreference} from '../../core/storage';
import i18n from './i18n';
import {localDateKey, reminderIsDue} from './preferences';
import {usePreferencesStore} from './preferencesStore';

export type ReminderPermission = 'authorized' | 'denied' | 'not_determined' | 'unavailable';

type NativeReminderModule = {
  permissionStatus: () => Promise<ReminderPermission>;
  requestPermission: () => Promise<ReminderPermission>;
  scheduleDaily: (
    identifier: string,
    hour: number,
    minute: number,
    title: string,
    body: string,
  ) => Promise<boolean>;
  scheduleOnce: (
    identifier: string,
    timestampMs: number,
    title: string,
    body: string,
  ) => Promise<boolean>;
  cancel: (identifier: string) => Promise<void>;
};

const nativeReminders = NativeModules.RediReminders as NativeReminderModule | undefined;
const LEARNING_REMINDER_ID = 'learning-daily';
const CLASS_REMINDER_PREFIX = 'live-class-';
export const LIVE_CLASS_REMINDER_LEAD_MINUTES = 15;
const MINIMUM_SCHEDULE_DELAY_MS = 1_000;

export function hasNativeReminderSupport(): boolean {
  return Boolean(nativeReminders);
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  if (!nativeReminders) return 'unavailable';
  try {
    return await nativeReminders.permissionStatus();
  } catch {
    return 'unavailable';
  }
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!nativeReminders) return 'unavailable';
  try {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return result === PermissionsAndroid.RESULTS.GRANTED ? 'authorized' : 'denied';
    }
    return await nativeReminders.requestPermission();
  } catch {
    return 'denied';
  }
}

export function permissionAllowsReminders(permission: ReminderPermission): boolean {
  // Unsupported native builds retain the existing app-open reminder fallback.
  return permission === 'authorized' || permission === 'unavailable';
}

export async function openReminderSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // The user can still open Settings manually.
  }
}

export async function syncLearningReminder(): Promise<boolean> {
  if (!nativeReminders) return false;
  const {hydrated, reminderEnabled, reminderHour, reminderMinute} = usePreferencesStore.getState();
  if (!hydrated || !reminderEnabled) {
    await nativeReminders.cancel(LEARNING_REMINDER_ID);
    return false;
  }
  return nativeReminders.scheduleDaily(
    LEARNING_REMINDER_ID,
    reminderHour,
    reminderMinute,
    i18n.t('reminderTitle'),
    i18n.t('reminderAlert'),
  );
}

export function liveClassReminderTimestamp(startsAt: string, now = Date.now()): number | null {
  const startsAtMs = Date.parse(startsAt);
  if (!Number.isFinite(startsAtMs) || startsAtMs <= now) return null;
  const preferred = startsAtMs - LIVE_CLASS_REMINDER_LEAD_MINUTES * 60_000;
  // If the learner enables it inside the 15-minute window, notify promptly
  // instead of silently rejecting a timestamp that has already passed.
  return Math.max(preferred, now + MINIMUM_SCHEDULE_DELAY_MS);
}

export function isUpcomingLiveClass(item: LiveClass, now = Date.now()): boolean {
  return item.status === 'scheduled' && (liveClassReminderTimestamp(item.startsAt, now) != null);
}

export async function scheduleLiveClassReminder(item: LiveClass): Promise<boolean> {
  if (!nativeReminders) return false;
  const timestamp = liveClassReminderTimestamp(item.startsAt);
  if (timestamp == null) return false;
  return nativeReminders.scheduleOnce(
    CLASS_REMINDER_PREFIX + item.id,
    timestamp,
    i18n.t('classReminderTitle'),
    i18n.t('classReminderBody', {title: item.title, minutes: LIVE_CLASS_REMINDER_LEAD_MINUTES}),
  );
}

export async function cancelLiveClassReminder(id: string): Promise<void> {
  if (!nativeReminders) return;
  await nativeReminders.cancel(CLASS_REMINDER_PREFIX + id);
}

export async function checkDueReminder(now = new Date()): Promise<boolean> {
  const {hydrated, reminderEnabled, reminderHour, reminderMinute} = usePreferencesStore.getState();
  if (!hydrated || !reminderEnabled) return false;
  const lastShown = await getPreference('reminderLastShown', '');
  if (!reminderIsDue(now, reminderEnabled, reminderHour, reminderMinute, lastShown)) return false;
  await setPreference('reminderLastShown', localDateKey(now));
  return true;
}

export function presentLearningReminder(): void {
  Alert.alert(i18n.t('reminderTitle'), i18n.t('reminderAlert'));
}

/** Keeps the old app-open behavior only when the native scheduler is unavailable. */
export function bindLearningReminders(): () => void {
  if (hasNativeReminderSupport()) return () => {};
  const onChange = (status: AppStateStatus) => {
    if (status !== 'active') return;
    void checkDueReminder().then(due => {
      if (due) presentLearningReminder();
    });
  };
  const sub = AppState.addEventListener('change', onChange);
  if (AppState.currentState === 'active') onChange('active');
  return () => sub.remove();
}
