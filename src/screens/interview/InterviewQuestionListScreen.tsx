import React from 'react';
import {ScrollView, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {AppText, EmptyState, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import type {HomeNav} from '../../navigation/types';
import {styles} from './styles';
import {colors} from '../../theme';
import {Icon} from '../../assets/icons';

export function InterviewQuestionListScreen() {
  const navigation = useNavigation<HomeNav>();
  const categoryId = (useRoute().params as {categoryId: string}).categoryId;
  const repos = useRepositories();
  const questions = useQuery({queryKey: queryKeys.interview({categoryId}), queryFn: () => repos.content.interviewQuestions(categoryId)});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: questions.isRefetching,
    onRefresh: () => {
      questions.refetch().catch(() => undefined);
    },
  });
  const categories = useQuery({
    queryKey: queryKeys.catalog('interview', {list: 'question-header'}),
    queryFn: () => repos.catalog.list({kind: 'interview'}),
  });
  const category = categories.data?.items.find(item => item.id === categoryId);
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title={category?.title ?? 'Interview Questions'} onBack={() => navigation.goBack()} />
      <ScrollView
        {...pullRefresh.scrollProps}
        contentContainerStyle={styles.page}>
        {questions.isLoading ? <LoadingBlock /> : null}
        {questions.isError ? <ErrorState message="Questions could not be loaded." onRetry={() => void questions.refetch()} /> : null}
        {questions.data?.map((item, index) => (
          <ClayCard key={item.id} variant="white" onPress={() => navigation.navigate('InterviewQuestion', {questionId: item.id})}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <View style={{width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pastel.mint}}>
                <AppText weight="900" size={10} color={colors.success}>{String(index + 1).padStart(2, '0')}</AppText>
              </View>
              <View style={{flex: 1, minWidth: 0, gap: 5}}>
                <AppText weight="800" numberOfLines={2}>{item.prompt}</AppText>
                <AppText size={10} color={colors.text2}>{category?.title ?? 'Interview practice'} · Model answer</AppText>
              </View>
              <Icon name="chev" size={14} color={colors.text3} />
            </View>
          </ClayCard>
        ))}
        {!questions.isLoading && !questions.isError && !questions.data?.length ? (
          <EmptyState title="No questions yet" body="This interview topic does not have published questions yet." />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
