export const VIDEO_QUALITY_OPTIONS = ['Auto', 'Data saver', 'High quality'] as const;
export type VideoQuality = (typeof VIDEO_QUALITY_OPTIONS)[number];

export const APP_LANGUAGES = [
  {id: 'en', label: 'English', native: 'English'},
  {id: 'hi', label: 'Hindi', native: 'हिन्दी'},
] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number]['id'];

export const LEARNING_GOALS = [
  {id: 'computer', label: 'Computer courses'},
  {id: 'exams', label: 'Competitive exams'},
  {id: 'general', label: 'General learning'},
] as const;
export type LearningGoal = (typeof LEARNING_GOALS)[number]['id'];

export const REMINDER_HOURS = [6, 7, 8, 9, 12, 17, 18, 19, 20, 21] as const;

export const DEFAULT_PREFERENCES = {
  wifiOnly: true,
  videoQuality: 'Auto' as VideoQuality,
  // Reminders are opt-in because Android and iOS require notification consent.
  reminderEnabled: false,
  reminderHour: 19,
  reminderMinute: 0,
  darkMode: false,
  language: 'en' as AppLanguage,
  notifClasses: true,
  notifTests: true,
  notifNews: true,
  notifOffers: true,
  onboardingComplete: false,
  learningGoal: null as LearningGoal | null,
};

export function isVideoQuality(value: unknown): value is VideoQuality {
  return VIDEO_QUALITY_OPTIONS.includes(value as VideoQuality);
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return APP_LANGUAGES.some(item => item.id === value);
}

export function isLearningGoal(value: unknown): value is LearningGoal {
  return LEARNING_GOALS.some(item => item.id === value);
}

export function videoQualitySubtitle(quality: VideoQuality): string {
  return quality === 'Auto' ? 'Auto (recommended)' : quality;
}

export function videoBitRate(quality: VideoQuality): number {
  if (quality === 'Data saver') return 700_000;
  if (quality === 'High quality') return 5_000_000;
  return 0;
}

export function formatReminderClock(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  const mm = String(minute).padStart(2, '0');
  return `${h12}:${mm} ${period}`;
}

export function formatReminderSubtitle(enabled: boolean, hour: number, minute: number): string {
  if (!enabled) return 'Off';
  return `Daily at ${formatReminderClock(hour, minute)}`;
}

export function languageLabel(language: AppLanguage): string {
  return APP_LANGUAGES.find(item => item.id === language)?.native ?? 'English';
}

export function transactionSubtitle(count: number): string {
  if (count <= 0) return 'No transactions';
  return count === 1 ? '1 transaction' : `${count} transactions`;
}

export function profileSubtitle(name?: string, email?: string): string {
  const parts = [name?.trim(), email?.trim()].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Name, photo and contact';
}

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function reminderIsDue(
  now: Date,
  enabled: boolean,
  hour: number,
  minute: number,
  lastShownKey: string,
): boolean {
  if (!enabled) return false;
  if (lastShownKey === localDateKey(now)) return false;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return minutesNow >= hour * 60 + minute;
}

export function matchesSettingsQuery(query: string, ...fields: Array<string | undefined>): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const compactNeedle = needle.replace(/[\s-]+/g, '');
  return fields.some(field => {
    if (!field) return false;
    const haystack = field.toLowerCase();
    return haystack.includes(needle) || haystack.replace(/[\s-]+/g, '').includes(compactNeedle);
  });
}
