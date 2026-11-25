import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
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
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'TestInstructions', params: {testId: dest.id}}});
      return;
    case 'liveClass':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'LiveRoom', params: {liveClassId: dest.id}}});
      return;
    case 'news':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'NewsArticle', params: {articleId: dest.id}}});
      return;
    case 'fact':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'FactDetail', params: {factId: dest.id}}});
      return;
    case 'interviewQuestion':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'InterviewQuestion', params: {questionId: dest.id}}});
      return;
    case 'interviewCategory':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'InterviewQuestionList', params: {categoryId: dest.id}}});
      return;
    case 'exam':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'ExamDetail', params: {examId: dest.id}}});
      return;
    case 'topic':
      navigation.navigate('Main', {screen: 'HomeTab', params: {screen: 'TopicDetail', params: {topicId: dest.id}}});
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
