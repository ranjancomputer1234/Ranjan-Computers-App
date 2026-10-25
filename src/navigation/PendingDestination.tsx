import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../features/catalog/openPublishedTarget';
import {useSessionStore} from '../core/session';
import type {ContentRef} from '../core/types';
import type {RootNav} from './types';

function replay(navigation: RootNav, dest: ContentRef) {
  switch (dest.kind) {
    case 'course':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'CourseDetail', params: {courseId: dest.id}}});
      return;
    case 'lesson':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'LessonPlayer', params: {lessonId: dest.id}}});
      return;
    case 'document':
      navigation.navigate('Main', {screen: 'ProfileTab', params: {screen: 'DocumentList'}});
      return;
    case 'test':
    case 'liveClass':
    case 'news':
    case 'fact':
    case 'interviewQuestion':
    case 'exam':
    case 'topic':
      showLearnerUnavailable();
      return;
    default:
      return;
  }
}

export function usePendingDestinationReplay() {
  const navigation = useNavigation<RootNav>();
  const status = useSessionStore(s => s.status);
  const pending = useSessionStore(s => s.pendingDestination);
  const setPendingDestination = useSessionStore(s => s.setPendingDestination);

  useEffect(() => {
    if (status !== 'authenticated' || !pending) {
      return;
    }
    const dest = pending;
    setPendingDestination(null);
    replay(navigation, dest);
  }, [status, pending, navigation, setPendingDestination]);
}
