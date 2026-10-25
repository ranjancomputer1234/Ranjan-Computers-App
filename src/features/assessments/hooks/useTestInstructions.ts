import {useMutation, useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';

export function useTestInstructions(testId: string) {
  const repos = useRepositories();
  const test = useQuery({queryKey: queryKeys.test(testId), queryFn: () => repos.assessments.test(testId)});
  const start = useMutation({
    mutationFn: () => repos.assessments.startAttempt(testId),
  });
  return {test, start, data: test.data};
}
