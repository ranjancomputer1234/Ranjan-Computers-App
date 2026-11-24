import type {LiveClass} from '../../core/types';

const LOOKBACK_MS = 45 * 24 * 60 * 60 * 1000;

/**
 * Prefer classes inside the requested window. When that window is empty, keep
 * recent classes and put the one closest to now first so the schedule is not blank.
 */
/** The bell is on for a scheduled or starting class. The server flag wins when it is present. */
export function canRemindLiveClass(item: Pick<LiveClass, 'status' | 'canSetReminder'>): boolean {
  if (item.canSetReminder === true) return true;
  if (item.canSetReminder === false) return false;
  return item.status === 'scheduled' || item.status === 'starting';
}

export function visibleLiveClasses(ranged: LiveClass[], catalog: LiveClass[], now = Date.now()): LiveClass[] {
  if (ranged.length) return ranged;
  const lookback = now - LOOKBACK_MS;
  const recent = catalog.filter(item => {
    if (item.status === 'cancelled') return false;
    const starts = Date.parse(item.startsAt);
    return Number.isFinite(starts) && starts >= lookback;
  });
  const chosen = recent.length ? recent : catalog.filter(item => item.status !== 'cancelled');
  return [...chosen].sort(
    (a, b) => Math.abs(Date.parse(a.startsAt) - now) - Math.abs(Date.parse(b.startsAt) - now),
  );
}
