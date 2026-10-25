import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';

export function useNewsArticle(articleId: string) {
  const repos = useRepositories();
  return useQuery({queryKey: queryKeys.article(articleId), queryFn: () => repos.content.article(articleId)});
}
