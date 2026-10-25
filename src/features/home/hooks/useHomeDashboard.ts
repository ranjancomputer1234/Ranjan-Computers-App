import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '../../../core/di';
import { queryKeys } from '../../../core/query';
import { accountKey, useSessionStore } from '../../../core/session';

export function useHomeDashboard() {
  const repos = useRepositories();
  const status = useSessionStore(s => s.status);
  const profile = useSessionStore(s => s.profile);
  const homeQuery = useQuery({
    queryKey: queryKeys.home(accountKey()),
    queryFn: () => repos.catalog.home(),
  });

  const name =
    status === 'authenticated'
      ? profile?.fullName ?? homeQuery.data?.greetingName ?? 'Learner'
      : 'Learner';

  return {
    status,
    homeQuery,
    name,
    liveClasses:
      homeQuery.data?.liveClasses.filter(item => item.status !== 'cancelled') ??
      [],
  };
}
