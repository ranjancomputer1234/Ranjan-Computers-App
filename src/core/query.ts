import NetInfo from '@react-native-community/netinfo';
import {focusManager, onlineManager, QueryClient} from '@tanstack/react-query';
import {AppState, AppStateStatus, Platform} from 'react-native';
import type {ContentKind} from './types';

onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(Boolean(state.isConnected));
  });
});

export function bindAppStateFocus(): () => void {
  const onChange = (status: AppStateStatus) => {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  };
  const sub = AppState.addEventListener('change', onChange);
  return () => sub.remove();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        const err = error as {retryable?: boolean; httpStatus?: number};
        if (err.httpStatus && err.httpStatus >= 400 && err.httpStatus < 500) {
          return false;
        }
        return err.retryable !== false && count < 2;
      },
      staleTime: 60_000,
      gcTime: 30 * 60_000,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  config: () => ['config'] as const,
  home: (userId: string | 'guest') => ['home', userId] as const,
  catalog: (kind: string, filters: Record<string, unknown>) => ['catalog', kind, filters] as const,
  course: (id: string, language?: string) => ['course', id, {language}] as const,
  courseReviews: (id: string, cursor?: string) => ['course', id, 'reviews', cursor] as const,
  lesson: (id: string) => ['lesson', id] as const,
  enrollments: (userId: string) => ['learner', userId, 'enrollments'] as const,
  learningSummary: (userId: string) => ['learner', userId, 'learning-summary'] as const,
  bookmarks: (userId: string) => ['learner', userId, 'bookmarks'] as const,
  search: (q: string, type?: string, cursor?: string) => ['search', {q, type, cursor}] as const,
  exam: (id: string) => ['exam', id] as const,
  tests: (filters: Record<string, unknown>) => ['tests', filters] as const,
  test: (id: string) => ['test', id] as const,
  attempt: (userId: string, id: string) => ['attempt', userId, id] as const,
  result: (userId: string, id: string) => ['result', userId, id] as const,
  news: (filters: Record<string, unknown>) => ['news', filters] as const,
  article: (id: string) => ['news', id] as const,
  topic: (id: string) => ['awareness', id] as const,
  facts: (filters: Record<string, unknown>) => ['facts', filters] as const,
  fact: (id: string) => ['facts', id] as const,
  interview: (filters: Record<string, unknown>) => ['interview', filters] as const,
  live: (filters: Record<string, unknown>) => ['live', filters] as const,
  liveClass: (id: string) => ['live', id] as const,
  profile: (userId: string) => ['learner', userId, 'profile'] as const,
  notifications: (userId: string, filters: Record<string, unknown>) =>
    ['learner', userId, 'notifications', filters] as const,
  documents: (userId: string, kind?: string) => ['learner', userId, 'documents', kind] as const,
  document: (userId: string, id: string) => ['learner', userId, 'document', id] as const,
  downloads: (userId: string) => ['learner', userId, 'downloads'] as const,
  semesters: (userId: string, enrollmentId: string) =>
    ['learner', userId, 'semester', enrollmentId] as const,
  semester: (userId: string, enrollmentId: string, semesterId: string) =>
    ['learner', userId, 'semester', enrollmentId, semesterId] as const,
  orders: (userId: string) => ['learner', userId, 'orders'] as const,
  order: (userId: string, id: string) => ['learner', userId, 'order', id] as const,
  quote: (userId: string, productId: string, coupon?: string) =>
    ['quote', userId, productId, coupon ?? ''] as const,
  entitlements: (userId: string) => ['learner', userId, 'entitlements'] as const,
  support: () => ['support'] as const,
  legal: (slug: string) => ['legal', slug] as const,
  content: (kind: ContentKind, id: string) => ['content', kind, id] as const,
};
