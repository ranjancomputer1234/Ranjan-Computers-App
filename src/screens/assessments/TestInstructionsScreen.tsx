import React from 'react';
import {ScrollView} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {isAuthenticated, useSessionStore} from '../../core/session';
import {colors} from '../../theme';
import {AccessBadge, AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen, StickyActionFooter} from '../../components/layout/Screen';
import type {HomeNav} from '../../navigation/types';
import {useTestInstructions} from '../../features/assessments/hooks/useTestInstructions';
import {styles} from './styles';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function TestInstructionsScreen() {
  const navigation = useNavigation<HomeNav>();
  const testId = (useRoute().params as {testId: string}).testId;
  const {test, start, data} = useTestInstructions(testId);
  const pullRefresh = usePullRefreshFeedback({
    refreshing: test.isRefetching,
    onRefresh: () => {
      test.refetch().catch(() => undefined);
    },
  });
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Instructions" onBack={() => navigation.goBack()} />
      {test.isLoading ? <LoadingBlock /> : null}
      {test.isError ? <ErrorState message="Could not load test rules." onRetry={() => test.refetch()} /> : null}
      {data ? (
        <>
          <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
            <ClayCard variant="blue">
              <AppText weight="900" size={18} color={colors.navy}>{data.title}</AppText>
              <AppText size={12} color={colors.text2}>{data.questionCount} questions · {Math.round(data.durationSeconds / 60)} minutes</AppText>
              <AccessBadge pricing={data.pricing} />
            </ClayCard>
            <ClayCard variant="white">
              <AppText size={12}>Marking: {data.marking ?? 'Not published'}</AppText>
              <AppText size={12}>Negative marking: {data.negativeMarking ?? 'Not published'}</AppText>
              {data.attemptLimit !== undefined ? <AppText size={12}>Attempt limit: {data.attemptLimit}</AppText> : null}
              {data.solutionPolicy ? <AppText size={12}>Solutions: {data.solutionPolicy}</AppText> : null}
            </ClayCard>
            {start.isError ? <AppText color={colors.error}>This attempt could not be started. Please retry.</AppText> : null}
          </ScrollView>
          <StickyActionFooter>
            <ClayButton
              label={start.isPending ? 'Starting…' : 'Begin test'}
              disabled={start.isPending}
              onPress={() => {
                if (!isAuthenticated()) {
                  useSessionStore.getState().setPendingDestination({kind: 'test', id: testId});
                  useSessionStore.getState().showLogin();
                  return;
                }
                if (data.access.state !== 'granted') {
                  if (data.access.reason === 'purchase_required' && data.productId) showLearnerUnavailable();
                  return;
                }
                start.mutate(undefined, {
                  onSuccess: attempt => {
                    if (data.mode === 'practice') navigation.navigate('DailyQuiz', {testId, attemptId: attempt.id});
                    else navigation.navigate('TestRunner', {attemptId: attempt.id});
                  },
                });
              }}
            />
          </StickyActionFooter>
        </>
      ) : null}
    </Screen>
  );
}
