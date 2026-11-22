import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {accountKey, useSessionStore} from '../../../core/session';
import {useDayStreak, useStreakStore} from '../streakStore';

export function useProfile() {
  const repos = useRepositories();
  const status = useSessionStore(s => s.status);
  const accountId = useSessionStore(s => s.tokens?.accountId ?? null);
  const sessionProfile = useSessionStore(s => s.profile);
  const streakDays = useDayStreak(status === 'authenticated' ? accountId : null);
  const profileQuery = useQuery({
    queryKey: queryKeys.profile(accountKey()),
    queryFn: () => repos.auth.me(),
    enabled: status === 'authenticated',
  });
  const docs = useQuery({
    queryKey: queryKeys.documents(accountKey(), 'admit_card'),
    queryFn: () => repos.account.documents('admit_card'),
    enabled: status === 'authenticated',
  });
  const certificates = useQuery({
    queryKey: queryKeys.documents(accountKey(), 'certificate'),
    queryFn: () => repos.account.documents('certificate'),
    enabled: status === 'authenticated',
  });
  const downloads = useQuery({
    queryKey: queryKeys.downloads(accountKey()),
    queryFn: () => repos.account.downloads(),
    enabled: status === 'authenticated',
  });
  const owner = accountKey();
  const enrollments = useQuery({
    queryKey: queryKeys.enrollments(owner),
    queryFn: () => repos.learning.enrollments(),
    enabled: status === 'authenticated',
  });
  const results = useQuery({
    queryKey: ['history', owner],
    queryFn: () => repos.assessments.history(),
    enabled: status === 'authenticated',
  });

  const refresh = async () => {
    const activeAccount = accountKey();
    await Promise.all([
      profileQuery.refetch(),
      docs.refetch(),
      certificates.refetch(),
      downloads.refetch(),
      enrollments.refetch(),
      results.refetch(),
      status === 'authenticated' && activeAccount !== 'guest'
        ? useStreakStore.getState().recordToday(activeAccount)
        : Promise.resolve(),
    ]);
  };

  return {
    status,
    profileQuery,
    docs,
    certificates,
    downloads,
    refresh,
    refreshing:
      profileQuery.isRefetching ||
      docs.isRefetching ||
      certificates.isRefetching ||
      downloads.isRefetching ||
      enrollments.isRefetching ||
      results.isRefetching,
    profile: withLearningStats(
      profileQuery.data ?? sessionProfile,
      enrollments.data?.length,
      results.data?.length,
      streakDays,
    ),
  };
}

function withLearningStats<T extends {stats: {courses: number; tests: number; streakDays: number}}>(
  profile: T | null,
  courses: number | undefined,
  tests: number | undefined,
  streakDays: number | undefined,
): T | null {
  if (!profile) return null;
  if (courses === undefined && tests === undefined && streakDays === undefined) return profile;
  return {
    ...profile,
    stats: {
      courses: courses ?? profile.stats.courses,
      tests: tests ?? profile.stats.tests,
      streakDays: streakDays ?? profile.stats.streakDays,
    },
  };
}
