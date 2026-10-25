import React from 'react';
import {ScrollView} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey} from '../../core/session';
import {AppText, ErrorState} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {LearningStackParamList} from '../../navigation/types';
import {styles} from './styles';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function SemesterContentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LearningStackParamList>>();
  const {enrollmentId, semesterId} = useRoute().params as {enrollmentId: string; semesterId: string};
  const repos = useRepositories();
  const data = useQuery({queryKey: queryKeys.semester(accountKey(), enrollmentId, semesterId), queryFn: () => repos.learning.semester(enrollmentId, semesterId)});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: data.isRefetching,
    onRefresh: () => {
      data.refetch().catch(() => undefined);
    },
  });
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title={data.data?.title ?? 'Semester'} onBack={() => navigation.goBack()} />
      {data.isError ? <ErrorState message="This semester is not available." onRetry={() => data.refetch()} /> : null}
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
        {data.data?.lessons.map(lesson => (
          <ClayCard key={lesson.id} variant="white" onPress={() => navigation.navigate('LessonPlayer', {courseId: lesson.courseId, lessonId: lesson.id, enrollmentId})}>
            <AppText weight="800">{lesson.title}</AppText>
          </ClayCard>
        ))}
        {data.data?.tests.map(test => <ClayCard key={test.id} variant="blue" onPress={() => navigation.navigate('TestInstructions', {testId: test.id})}><AppText weight="800">{test.title}</AppText><AppText>{test.questionCount} questions</AppText></ClayCard>)}
        {data.data?.projects.map(project => (
          <ClayCard key={project.id} variant="orange" onPress={() => navigation.navigate('ProjectDetail', {projectId: project.id})}>
            <AppText weight="800">{project.title}</AppText>
            <AppText size={11}>{project.status}</AppText>
          </ClayCard>
        ))}
      </ScrollView>
    </Screen>
  );
}
