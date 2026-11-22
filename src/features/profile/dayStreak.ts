const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function previousDayKey(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return localDayKey(date);
}

export function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 50);
  return Math.max(1000, next.getTime() - now.getTime());
}

/** Consecutive local days ending today, or yesterday when today is not recorded yet. */
export function currentStreak(days: readonly string[], today = localDayKey()): number {
  const active = new Set(days.filter(day => DAY_KEY.test(day)));
  let cursor = active.has(today) ? today : previousDayKey(today);
  let count = 0;
  while (active.has(cursor)) {
    count += 1;
    cursor = previousDayKey(cursor);
  }
  return count;
}

export function mergeActiveDay(days: readonly string[], today = localDayKey(), limit = 400): string[] {
  const active = new Set(days.filter(day => DAY_KEY.test(day)));
  active.add(today);
  return [...active].sort().slice(-limit);
}
