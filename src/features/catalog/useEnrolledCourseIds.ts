import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey, useSessionStore} from '../../core/session';

/** Active enrollment course ids for the signed-in learner. */
export function useEnrolledCourseIds() {
  const repos = useRepositories();
  const status = useSessionStore(state => state.status);
  const userKey = accountKey();
  const enrollments = useQuery({
    queryKey: queryKeys.enrollments(userKey),
    queryFn: () => repos.learning.enrollments(),
    enabled: status === 'authenticated',
  });
  const ids = useMemo(
    () => new Set((enrollments.data ?? []).map(item => item.courseId)),
    [enrollments.data],
  );
  return {ids, refetch: enrollments.refetch};
}
