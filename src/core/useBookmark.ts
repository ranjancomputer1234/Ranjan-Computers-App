import {Alert} from 'react-native';
import {useMutation} from '@tanstack/react-query';
import {useRepositories} from './di';
import {queryClient} from './query';
import {isAuthenticated, useSessionStore} from './session';
import type {ContentRef} from './types';

export function useBookmark(ref: ContentRef) {
  const repos = useRepositories();
  const action = useMutation({
    mutationFn: () => repos.learning.setBookmark(ref, true),
    onSuccess: async () => { await queryClient.invalidateQueries({queryKey: ['learner']}); Alert.alert('Saved', 'Find this in My Learning.'); },
    onError: () => Alert.alert('Could not save', 'Please try again.'),
  });
  return () => {
    if (!isAuthenticated()) {
      useSessionStore.getState().setPendingDestination(ref);
      useSessionStore.getState().showLogin();
    } else if (!action.isPending) action.mutate();
  };
}
