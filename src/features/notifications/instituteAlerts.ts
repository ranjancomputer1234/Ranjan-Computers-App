import type {Repositories} from '../../core/repositories';
import type {NotificationItem} from '../../core/types';
import {isInternalTestCourse, isInternalTestTitle} from '../catalog/courseCopy';
import {getReminderPermission, permissionAllowsReminders} from '../settings/reminders';
import {NativeModules} from 'react-native';
import {usePreferencesStore} from '../settings/preferencesStore';
import {
  alertsAreReady,
  markAlertsReady,
  readAlertSeen,
  readClassTimes,
  readInstituteAnnouncements,
  writeAlertSeen,
  writeClassTimes,
  writeInstituteAnnouncements,
} from './announcementStore';

type NativeReminderModule = {
  scheduleOnce: (identifier: string, timestampMs: number, title: string, body: string) => Promise<boolean>;
};

const nativeReminders = NativeModules.RaciReminders as NativeReminderModule | undefined;
let syncing = false;

function classWhen(iso: string): string {
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

async function notifyDevice(item: NotificationItem): Promise<void> {
  if (!nativeReminders) return;
  const permission = await getReminderPermission();
  if (!permissionAllowsReminders(permission)) return;
  await nativeReminders.scheduleOnce(`institute-${item.id}`, Date.now() + 1500, item.title, item.body);
}

export async function syncInstituteAlerts(repos: Repositories): Promise<void> {
  const prefs = usePreferencesStore.getState();
  if (!prefs.hydrated || !prefs.notifAnnouncements || syncing) return;
  syncing = true;
  try {
    const [news, courses, classes, seen, previousTimes, ready, existing] = await Promise.all([
      repos.content.news().catch(() => ({items: []})),
      repos.catalog.list({kind: 'course'}).catch(() => ({items: []})),
      repos.live.schedule(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      ).catch(() => []),
      readAlertSeen(),
      readClassTimes(),
      alertsAreReady(),
      readInstituteAnnouncements(),
    ]);

    const now = new Date().toISOString();
    const candidates: NotificationItem[] = [];
    const nextTimes: Record<string, string> = {};

    if (prefs.notifNews) {
      for (const article of news.items) {
        if (isInternalTestTitle(article.title)) continue;
        candidates.push({
          id: `announce-news-${article.id}`,
          title: article.title,
          body: article.excerpt?.trim() || 'A new institute announcement is available.',
          createdAt: article.publishedAt || now,
          read: false,
          category: 'news',
          source: 'automatic',
          priority: 'normal',
          actionLabel: 'Read',
          target: {kind: 'news', id: article.id},
        });
      }
      for (const course of courses.items) {
        if (course.kind !== 'course' || isInternalTestCourse(course)) continue;
        candidates.push({
          id: `announce-course-${course.id}`,
          title: course.title,
          body: course.subtitle?.trim() || `${course.title} is now open for enrolment.`,
          createdAt: now,
          read: false,
          category: 'news',
          source: 'automatic',
          priority: 'normal',
          actionLabel: 'View course',
          target: {kind: 'course', id: course.id},
        });
      }
    }

    if (prefs.notifClasses) {
      for (const item of classes) {
        if (item.status === 'cancelled' || item.status === 'ended') continue;
        nextTimes[item.id] = item.startsAt;
        const previous = previousTimes[item.id];
        const changed = Boolean(previous && previous !== item.startsAt);
        candidates.push({
          id: changed ? `announce-class-${item.id}-${item.startsAt}` : `announce-class-${item.id}`,
          title: changed ? `Schedule change: ${item.title}` : item.title,
          body: changed
            ? `${item.title} has moved to ${classWhen(item.startsAt)}.`
            : `${item.title} is scheduled for ${classWhen(item.startsAt)}.`,
          createdAt: now,
          read: false,
          category: 'classes',
          source: 'automatic',
          priority: changed ? 'high' : 'normal',
          actionLabel: 'View class',
          target: {kind: 'liveClass', id: item.id},
        });
      }
    }

    const seenSet = new Set(seen);
    const fresh = candidates.filter(item => !seenSet.has(item.id));
    await writeAlertSeen([...new Set([...seen, ...candidates.map(item => item.id)])]);
    await writeClassTimes({...previousTimes, ...nextTimes});
    if (!ready) {
      await writeInstituteAnnouncements(candidates.map(item => ({...item, read: true})));
      await markAlertsReady();
      return;
    }
    if (!fresh.length) return;
    const inbox = [...fresh, ...existing.filter(item => !fresh.some(next => next.id === item.id))].slice(0, 30);
    await writeInstituteAnnouncements(inbox);
    for (const item of fresh.slice(0, 3)) {
      const title = item.id.startsWith('announce-course-') ? `New course: ${item.title}` : item.title;
      await notifyDevice({...item, title});
    }
  } finally {
    syncing = false;
  }
}
