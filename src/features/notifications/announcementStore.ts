import {getPreference, setPreference} from '../../core/storage';
import type {NotificationItem} from '../../core/types';

const ITEMS_KEY = 'instituteAnnouncements';
const SEEN_KEY = 'instituteAlertSeen';
const CLASS_TIMES_KEY = 'instituteClassTimes';
const READY_KEY = 'instituteAlertReady';

export async function readInstituteAnnouncements(): Promise<NotificationItem[]> {
  const stored = await getPreference<NotificationItem[]>(ITEMS_KEY, []);
  return Array.isArray(stored) ? stored.filter(item => item && typeof item.id === 'string') : [];
}

export async function writeInstituteAnnouncements(items: NotificationItem[]): Promise<void> {
  await setPreference(ITEMS_KEY, items.slice(0, 30));
}

export async function readAlertSeen(): Promise<string[]> {
  const stored = await getPreference<string[]>(SEEN_KEY, []);
  return Array.isArray(stored) ? stored.filter(item => typeof item === 'string') : [];
}

export async function writeAlertSeen(ids: string[]): Promise<void> {
  await setPreference(SEEN_KEY, ids.slice(0, 120));
}

export async function readClassTimes(): Promise<Record<string, string>> {
  const stored = await getPreference<Record<string, string>>(CLASS_TIMES_KEY, {});
  return stored && typeof stored === 'object' ? stored : {};
}

export async function writeClassTimes(times: Record<string, string>): Promise<void> {
  await setPreference(CLASS_TIMES_KEY, times);
}

export async function alertsAreReady(): Promise<boolean> {
  return Boolean(await getPreference(READY_KEY, false));
}

export async function markAlertsReady(): Promise<void> {
  await setPreference(READY_KEY, true);
}
