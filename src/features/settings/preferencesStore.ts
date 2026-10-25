import {create} from 'zustand';
import {getPreference, setPreference} from '../../core/storage';
import i18n from './i18n';
import {
  DEFAULT_PREFERENCES,
  isAppLanguage,
  isLearningGoal,
  isVideoQuality,
  type AppLanguage,
  type LearningGoal,
  type VideoQuality,
} from './preferences';

type PreferencesState = {
  hydrated: boolean;
  wifiOnly: boolean;
  videoQuality: VideoQuality;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  darkMode: boolean;
  language: AppLanguage;
  notifClasses: boolean;
  notifTests: boolean;
  notifNews: boolean;
  notifOffers: boolean;
  onboardingComplete: boolean;
  learningGoal: LearningGoal | null;
  hydrate: () => Promise<void>;
  setWifiOnly: (value: boolean) => void;
  setVideoQuality: (value: VideoQuality) => void;
  setReminderEnabled: (value: boolean) => void;
  setReminderTime: (hour: number, minute?: number) => void;
  setDarkMode: (value: boolean) => void;
  setLanguage: (value: AppLanguage) => void;
  setNotifClasses: (value: boolean) => void;
  setNotifTests: (value: boolean) => void;
  setNotifNews: (value: boolean) => void;
  setNotifOffers: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  setLearningGoal: (value: LearningGoal | null) => void;
};

export const usePreferencesStore = create<PreferencesState>(set => ({
  hydrated: false,
  ...DEFAULT_PREFERENCES,
  hydrate: async () => {
    const [
      wifiOnly,
      videoQuality,
      reminderEnabled,
      reminderHour,
      reminderMinute,
      darkMode,
      language,
      notifClasses,
      notifTests,
      notifNews,
      notifOffers,
      onboardingComplete,
      learningGoal,
    ] = await Promise.all([
      getPreference('wifiOnly', DEFAULT_PREFERENCES.wifiOnly),
      getPreference('videoQuality', DEFAULT_PREFERENCES.videoQuality),
      getPreference('reminderEnabled', DEFAULT_PREFERENCES.reminderEnabled),
      getPreference('reminderHour', DEFAULT_PREFERENCES.reminderHour),
      getPreference('reminderMinute', DEFAULT_PREFERENCES.reminderMinute),
      getPreference('darkMode', DEFAULT_PREFERENCES.darkMode),
      getPreference('language', DEFAULT_PREFERENCES.language),
      getPreference('notifClasses', DEFAULT_PREFERENCES.notifClasses),
      getPreference('notifTests', DEFAULT_PREFERENCES.notifTests),
      getPreference('notifNews', DEFAULT_PREFERENCES.notifNews),
      getPreference('notifOffers', DEFAULT_PREFERENCES.notifOffers),
      getPreference('onboardingComplete', DEFAULT_PREFERENCES.onboardingComplete),
      getPreference('learningGoal', DEFAULT_PREFERENCES.learningGoal),
    ]);
    const nextLanguage = isAppLanguage(language) ? language : DEFAULT_PREFERENCES.language;
    const nextQuality = isVideoQuality(videoQuality) ? videoQuality : DEFAULT_PREFERENCES.videoQuality;
    set({
      hydrated: true,
      wifiOnly: Boolean(wifiOnly),
      videoQuality: nextQuality,
      reminderEnabled: Boolean(reminderEnabled),
      reminderHour: Number.isFinite(reminderHour) ? Number(reminderHour) : DEFAULT_PREFERENCES.reminderHour,
      reminderMinute: Number.isFinite(reminderMinute) ? Number(reminderMinute) : DEFAULT_PREFERENCES.reminderMinute,
      darkMode: Boolean(darkMode),
      language: nextLanguage,
      notifClasses: Boolean(notifClasses),
      notifTests: Boolean(notifTests),
      notifNews: Boolean(notifNews),
      notifOffers: Boolean(notifOffers),
      onboardingComplete: Boolean(onboardingComplete),
      learningGoal: isLearningGoal(learningGoal) ? learningGoal : null,
    });
    if (i18n.language !== nextLanguage) void i18n.changeLanguage(nextLanguage);
  },
  setWifiOnly: value => {
    set({wifiOnly: value});
    void setPreference('wifiOnly', value);
  },
  setVideoQuality: value => {
    set({videoQuality: value});
    void setPreference('videoQuality', value);
  },
  setReminderEnabled: value => {
    set({reminderEnabled: value});
    void setPreference('reminderEnabled', value);
  },
  setReminderTime: (hour, minute = 0) => {
    set({reminderHour: hour, reminderMinute: minute, reminderEnabled: true});
    void setPreference('reminderHour', hour);
    void setPreference('reminderMinute', minute);
    void setPreference('reminderEnabled', true);
  },
  setDarkMode: value => {
    set({darkMode: value});
    void setPreference('darkMode', value);
  },
  setLanguage: value => {
    set({language: value});
    void setPreference('language', value);
    void i18n.changeLanguage(value);
  },
  setNotifClasses: value => {
    set({notifClasses: value});
    void setPreference('notifClasses', value);
  },
  setNotifTests: value => {
    set({notifTests: value});
    void setPreference('notifTests', value);
  },
  setNotifNews: value => {
    set({notifNews: value});
    void setPreference('notifNews', value);
  },
  setNotifOffers: value => {
    set({notifOffers: value});
    void setPreference('notifOffers', value);
  },
  setOnboardingComplete: value => {
    set({onboardingComplete: value});
    void setPreference('onboardingComplete', value);
  },
  setLearningGoal: value => {
    set({learningGoal: value});
    void setPreference('learningGoal', value);
  },
}));
