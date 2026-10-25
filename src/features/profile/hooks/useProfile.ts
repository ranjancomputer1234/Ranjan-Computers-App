import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {accountKey, useSessionStore} from '../../../core/session';

export function useProfile() {
  const repos = useRepositories();
  const status = useSessionStore(s => s.status);
  const sessionProfile = useSessionStore(s => s.profile);
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

  const refresh = async () => {
    await Promise.all([
      profileQuery.refetch(),
      docs.refetch(),
      certificates.refetch(),
      downloads.refetch(),
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
      downloads.isRefetching,
    profile: profileQuery.data ?? sessionProfile,
  };
}
