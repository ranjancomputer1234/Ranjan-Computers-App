import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {isAuthenticated} from '../../../core/session';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';

export function useFactsList(categoryId?: string) {
  const repos = useRepositories();
  const qc = useQueryClient();
  const query = useInfiniteQuery({queryKey: queryKeys.facts({categoryId}), initialPageParam: undefined as string | undefined, queryFn: ({pageParam}) => repos.content.facts(categoryId, pageParam), getNextPageParam: page => page.nextCursor ?? undefined});
  const facts = {...query, data: query.data ? {items: query.data.pages.flatMap(page => page.items)} : undefined};
  const react = useMutation({
    mutationFn: ({id, reacted}: {id: string; reacted: boolean}) => {
      if (!isAuthenticated()) throw new Error('Sign in to react to a fact.');
      return repos.content.reactFact(id, reacted);
    },
    onSuccess: () => qc.invalidateQueries({queryKey: queryKeys.facts({categoryId})}),
  });
  return {facts, react};
}
