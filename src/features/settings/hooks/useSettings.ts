import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {accountKey, useSessionStore} from '../../../core/session';
import {usePreferencesStore} from '../preferencesStore';
import {formatReminderSubtitle, languageLabel, profileSubtitle, transactionSubtitle, videoQualitySubtitle} from '../preferences';

export function useSettings() {
  const repos = useRepositories();
  const status = useSessionStore(s => s.status);
  const profile = useSessionStore(s => s.profile);
  const prefs = usePreferencesStore();
  const signedIn = status === 'authenticated';
  const orders = useQuery({
    queryKey: queryKeys.orders(accountKey()),
    queryFn: () => repos.commerce.history(),
    enabled: signedIn,
  });

  return {
    signedIn,
    profile,
    orders,
    prefs,
    editSubtitle: profileSubtitle(profile?.fullName, profile?.email),
    paymentSubtitle: signedIn ? transactionSubtitle(orders.data?.length ?? 0) : 'Sign in to view purchases',
    qualitySubtitle: videoQualitySubtitle(prefs.videoQuality),
    reminderSubtitle: formatReminderSubtitle(prefs.reminderEnabled, prefs.reminderHour, prefs.reminderMinute),
    languageValue: languageLabel(prefs.language),
  };
}
