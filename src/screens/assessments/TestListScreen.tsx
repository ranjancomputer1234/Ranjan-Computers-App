import React from 'react';
import {ScrollView, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {AppText, AccessBadge, EmptyState, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import type {HomeNav} from '../../navigation/types';
import {styles} from './styles';
import {colors} from '../../theme';
import {Icon} from '../../assets/icons';

export function TestListScreen() {
  const navigation = useNavigation<HomeNav>();
  const examId = (useRoute().params as {examId?: string} | undefined)?.examId;
  const repos = useRepositories();
  const tests = useQuery({queryKey: queryKeys.tests({examId}), queryFn: () => repos.assessments.tests(examId)});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: tests.isRefetching,
    onRefresh: () => {
      tests.refetch().catch(() => undefined);
    },
  });
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="All Tests" onBack={() => navigation.goBack()} />
      <ScrollView
        {...pullRefresh.scrollProps}
        contentContainerStyle={styles.page}>
        {tests.isLoading ? <LoadingBlock /> : null}
        {tests.isError ? <ErrorState message="Tests could not be loaded." onRetry={() => void tests.refetch()} /> : null}
        {tests.data?.map(test => (
          <ClayCard key={test.id} variant="white" onPress={() => navigation.navigate('TestInstructions', {testId: test.id})}>
            <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 10}}>
              <View style={{flex: 1, minWidth: 0, gap: 8}}>
                <AppText weight="800">{test.title}</AppText>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    <Icon name="doc" size={12} color={colors.text3} />
                    <AppText size={11} color={colors.text2}>{test.questionCount} questions</AppText>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    <Icon name="clock" size={12} color={colors.text3} />
                    <AppText size={11} color={colors.text2}>{Math.round(test.durationSeconds / 60)} min</AppText>
                  </View>
                </View>
                <AccessBadge pricing={test.pricing} />
              </View>
              <Icon name="chev" size={14} color={colors.text3} />
            </View>
          </ClayCard>
        ))}
        {!tests.isLoading && !tests.isError && !tests.data?.length ? (
          <EmptyState title="No tests for this exam" body="Published tests will appear here when they are available." />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
