import {
  DEFAULT_PREFERENCES,
  formatReminderClock,
  formatReminderSubtitle,
  languageLabel,
  isLearningGoal,
  localDateKey,
  matchesSettingsQuery,
  profileSubtitle,
  reminderIsDue,
  transactionSubtitle,
  videoBitRate,
  videoQualitySubtitle,
} from '../src/features/settings/preferences';
import {resolveColorScheme} from '../src/theme';
import {translateUiString} from '../src/features/settings/uiTranslations';

describe('settings copy helpers', () => {
  it('labels auto quality as recommended', () => {
    expect(videoQualitySubtitle('Auto')).toBe('Auto (recommended)');
    expect(videoQualitySubtitle('Data saver')).toBe('Data saver');
    expect(videoBitRate('Data saver')).toBe(700000);
    expect(videoBitRate('Auto')).toBe(0);
  });

  it('formats the HTML reminder time', () => {
    expect(formatReminderClock(19, 0)).toBe('7:00 PM');
    expect(formatReminderSubtitle(true, 19, 0)).toBe('Daily at 7:00 PM');
    expect(formatReminderSubtitle(false, 19, 0)).toBe('Off');
  });

  it('keeps profile and purchase subtitles honest', () => {
    expect(profileSubtitle('Learner', 'learner@example.com')).toBe('Learner · learner@example.com');
    expect(transactionSubtitle(2)).toBe('2 transactions');
    expect(transactionSubtitle(0)).toBe('No transactions');
    expect(languageLabel('hi')).toBe('हिन्दी');
  });

  it('filters settings search without requiring a translated catalogue', () => {
    expect(matchesSettingsQuery('wifi', 'Download over Wi-Fi only', 'Save mobile data')).toBe(true);
    expect(matchesSettingsQuery('privacy', 'Language')).toBe(false);
  });

  it('accepts only supported onboarding learning goals', () => {
    expect(isLearningGoal('computer')).toBe(true);
    expect(isLearningGoal('exams')).toBe(true);
    expect(isLearningGoal('unknown')).toBe(false);
  });
});

describe('learning reminder due check', () => {
  it('starts disabled until the learner opts in', () => {
    expect(DEFAULT_PREFERENCES.reminderEnabled).toBe(false);
  });

  it('fires once per day after the chosen time', () => {
    const now = new Date('2026-09-17T19:05:00');
    expect(reminderIsDue(now, true, 19, 0, '')).toBe(true);
    expect(reminderIsDue(now, true, 19, 0, localDateKey(now))).toBe(false);
    expect(reminderIsDue(now, false, 19, 0, '')).toBe(false);
    expect(reminderIsDue(new Date('2026-09-17T18:59:00'), true, 19, 0, '')).toBe(false);
  });
});

describe('theme scheme', () => {
  it('forces dark when the Settings toggle is on, otherwise follows the system', () => {
    expect(resolveColorScheme(true, 'light')).toBe('dark');
    expect(resolveColorScheme(false, 'dark')).toBe('light');
    expect(resolveColorScheme(false, 'light')).toBe('light');
  });
});

describe('app language copy', () => {
  it('translates shared app chrome to Hindi and restores English', () => {
    expect(translateUiString('Home', 'hi')).toBe('होम');
    expect(translateUiString('My Learning', 'hi-IN')).toBe('मेरी पढ़ाई');
    expect(translateUiString('Home', 'en')).toBe('Home');
  });

  it('translates dynamic UI counts without changing published content', () => {
    expect(translateUiString('12 lessons', 'hi')).toBe('12 पाठ');
    expect(translateUiString('A course title from the API', 'hi')).toBe('A course title from the API');
  });
});
