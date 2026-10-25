import React from 'react';
import {ScrollView} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {colors} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {useBookmark} from '../../core/useBookmark';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {PlanetArt} from '../../assets/illustrations';
import {shareService} from '../../core/services';
import type {HomeNav} from '../../navigation/types';
import {styles} from './styles';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function FactDetailScreen() {
  const navigation = useNavigation<HomeNav>();
  const factId = (useRoute().params as {factId: string}).factId;
  const bookmark = useBookmark({kind: 'fact', id: factId});
  const repos = useRepositories();
  const fact = useQuery({queryKey: queryKeys.fact(factId), queryFn: () => repos.content.fact(factId)});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: fact.isRefetching,
    onRefresh: () => {
      fact.refetch().catch(() => undefined);
    },
  });
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Fact" onBack={() => navigation.goBack()} onBookmark={bookmark} onShare={() => shareService.share(fact.data?.text ?? '')} />
      {fact.isLoading ? <LoadingBlock /> : null}
      {fact.isError ? <ErrorState message="This fact could not be loaded." onRetry={() => void fact.refetch()} /> : null}
      {fact.data ? (
        <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
          <ClayCard variant="lavender">
            <PlanetArt />
            <AppText weight="800" size={16} color={colors.navy}>{fact.data.text}</AppText>
            {fact.data.explanation ? <AppText size={13} style={{lineHeight: 21}}>{fact.data.explanation}</AppText> : null}
            {fact.data.quizId ? <ClayButton label="Practice this topic" compact onPress={() => navigation.navigate('TestInstructions', {testId: fact.data!.quizId!})} /> : null}
          </ClayCard>
        </ScrollView>
      ) : null}
    </Screen>
  );
}
