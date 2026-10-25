import {useInfiniteQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';

export function useNewsFeed(categoryId?: string) {
  const repos = useRepositories();
  const query = useInfiniteQuery({queryKey: queryKeys.news({categoryId}), initialPageParam: undefined as string | undefined, queryFn: ({pageParam}) => repos.content.news(categoryId, pageParam), getNextPageParam: page => page.nextCursor ?? undefined});
  return {...query, data: query.data ? {items: query.data.pages.flatMap(page => page.items)} : undefined};
}
