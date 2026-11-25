import {readInstituteAnnouncements} from '../features/notifications/announcementStore';
import {getAccountScoped, getPreference, setAccountScoped} from './storage';
import type {LiveClass, NotificationItem, Page} from './types';

const STORAGE_KEY = 'notificationInbox';

type StoredInbox = {
  readIds: string[];
  seenAt: Record<string, string>;
};

export type LocalInboxInput = {
  nowIso: string;
  seenAt: Record<string, string>;
  readIds: string[];
  liveClasses: Pick<LiveClass, 'id' | 'title' | 'startsAt' | 'status' | 'instructorName'>[];
  classesEnabled: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
};

function formatClock(hour: number, minute: number): string {
  const normalizedHour = ((Math.trunc(hour) % 24) + 24) % 24;
  const period = normalizedHour >= 12 ? 'PM' : 'AM';
  const hour12 = normalizedHour % 12 || 12;
  const minutes = String(Math.min(59, Math.max(0, Math.trunc(minute)))).padStart(2, '0');
  return `${hour12}:${minutes} ${period}`;
}

function formatClassWhen(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 'soon';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function isInboxClass(item: LocalInboxInput['liveClasses'][number], nowMs: number): boolean {
  if (item.status === 'cancelled' || item.status === 'ended') return false;
  if (item.status === 'live' || item.status === 'starting' || item.status === 'reconnecting') return true;
  const startsAt = Date.parse(item.startsAt);
  return item.status === 'scheduled' && Number.isFinite(startsAt) && startsAt > nowMs - 2 * 60 * 60 * 1000;
}

/** Device inbox used when GET /me/notifications is not deployed. */
export function buildLocalNotifications(input: LocalInboxInput): {items: NotificationItem[]; seenAt: Record<string, string>} {
  const seenAt = {...input.seenAt};
  const read = new Set(input.readIds);
  const stamp = (id: string) => {
    if (!seenAt[id]) seenAt[id] = input.nowIso;
    return seenAt[id];
  };
  const items: NotificationItem[] = [];
  const welcomeId = 'local-welcome';
  items.push({
    id: welcomeId,
    title: 'Your inbox is ready',
    body: 'Class reminders and account updates appear here. Messages from RACI show up when the institute publishes them.',
    createdAt: stamp(welcomeId),
    read: read.has(welcomeId),
    category: 'system',
    source: 'automatic',
    priority: 'normal',
  });

  if (input.reminderEnabled) {
    const id = 'local-study-reminder';
    items.push({
      id,
      title: 'Daily study reminder',
      body: `This device will remind you at ${formatClock(input.reminderHour, input.reminderMinute)}.`,
      createdAt: stamp(id),
      read: read.has(id),
      category: 'system',
      source: 'automatic',
      priority: 'normal',
    });
  }

  if (input.classesEnabled) {
    const nowMs = Date.parse(input.nowIso);
    const upcoming = input.liveClasses
      .filter(item => isInboxClass(item, Number.isFinite(nowMs) ? nowMs : Date.now()))
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
      .slice(0, 8);
    for (const item of upcoming) {
      const id = `local-class-${item.id}`;
      const live = item.status === 'live' || item.status === 'starting' || item.status === 'reconnecting';
      const instructor = item.instructorName.trim();
      items.push({
        id,
        title: live ? `${item.title} is live` : item.title,
        body: live
          ? `Join ${item.title}${instructor ? ` with ${instructor}` : ''}.`
          : `${item.title} starts ${formatClassWhen(item.startsAt)}.`,
        createdAt: stamp(id),
        read: read.has(id),
        category: 'classes',
        source: 'automatic',
        priority: live ? 'high' : 'normal',
        actionLabel: live ? 'Join class' : 'View class',
        target: {kind: 'liveClass', id: item.id},
      });
    }
  }

  items.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  return {items, seenAt};
}

async function readStoredInbox(accountId: string): Promise<StoredInbox> {
  const stored = await getAccountScoped<StoredInbox>(accountId, STORAGE_KEY, {readIds: [], seenAt: {}});
  return {
    readIds: Array.isArray(stored.readIds) ? stored.readIds.filter(id => typeof id === 'string') : [],
    seenAt: stored.seenAt && typeof stored.seenAt === 'object' ? stored.seenAt : {},
  };
}

async function inboxPreferences(): Promise<Pick<LocalInboxInput, 'classesEnabled' | 'reminderEnabled' | 'reminderHour' | 'reminderMinute'>> {
  const [classesEnabled, reminderEnabled, reminderHour, reminderMinute] = await Promise.all([
    getPreference('notifClasses', true),
    getPreference('reminderEnabled', false),
    getPreference('reminderHour', 19),
    getPreference('reminderMinute', 0),
  ]);
  return {
    classesEnabled: classesEnabled !== false,
    reminderEnabled: Boolean(reminderEnabled),
    reminderHour: typeof reminderHour === 'number' ? reminderHour : 19,
    reminderMinute: typeof reminderMinute === 'number' ? reminderMinute : 0,
  };
}

export async function localNotificationPage(
  accountId: string,
  liveClasses: LiveClass[],
  category?: string,
): Promise<Page<NotificationItem>> {
  const stored = await readStoredInbox(accountId);
  const prefs = await inboxPreferences();
  const built = buildLocalNotifications({
    nowIso: new Date().toISOString(),
    seenAt: stored.seenAt,
    readIds: stored.readIds,
    liveClasses,
    ...prefs,
  });
  const seenChanged = Object.keys(built.seenAt).some(id => built.seenAt[id] !== stored.seenAt[id]);
  if (seenChanged) {
    await setAccountScoped(accountId, STORAGE_KEY, {readIds: stored.readIds, seenAt: built.seenAt});
  }
  const announcements = await readInstituteAnnouncements();
  const merged = [...announcements, ...built.items.filter(item => !announcements.some(announcement => announcement.id === item.id))];
  merged.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const items = !category || category === 'all' ? merged : merged.filter(item => item.category === category);
  return {items, nextCursor: null, total: items.length};
}

export async function markLocalNotificationRead(accountId: string, id: string): Promise<void> {
  const stored = await readStoredInbox(accountId);
  if (stored.readIds.includes(id)) return;
  await setAccountScoped(accountId, STORAGE_KEY, {
    readIds: [...stored.readIds, id],
    seenAt: stored.seenAt,
  });
}

export async function markAllLocalNotificationsRead(accountId: string, liveClasses: LiveClass[]): Promise<void> {
  const page = await localNotificationPage(accountId, liveClasses);
  const stored = await readStoredInbox(accountId);
  await setAccountScoped(accountId, STORAGE_KEY, {
    readIds: [...new Set([...stored.readIds, ...page.items.map(item => item.id)])],
    seenAt: stored.seenAt,
  });
}
