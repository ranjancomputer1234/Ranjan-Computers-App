import React from 'react';
import {ScrollView} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {isAppError} from '../../core/api/http';
import {AppText, ClayButton, EmptyState, ErrorState, LoadingBlock} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {appConfig} from '../../core/config';
import {shareService} from '../../core/services';
import {styles} from './styles';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function LegalScreen() {
  const navigation = useNavigation();
  const slug = (useRoute().params as {slug: string}).slug;
  const repos = useRepositories();
  const legal = useQuery({queryKey: queryKeys.legal(slug), queryFn: () => repos.account.legal(slug)});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: legal.isRefetching,
    onRefresh: () => {
      legal.refetch().catch(() => undefined);
    },
  });
  const publicUrl = slug === 'privacy' ? appConfig.privacyPolicyUrl : undefined;
  return <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
    <DetailHeader title={legal.data?.title ?? (slug === 'privacy' ? 'Privacy policy' : 'Terms of use')} onBack={() => navigation.goBack()} />
    <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
      {publicUrl ? <ClayButton label="Read on our website" tone="ghost" onPress={() => void shareService.openUrl(publicUrl)} /> : null}
      {legal.isLoading ? <LoadingBlock /> : legal.isError ? (
        <ErrorState
          message={isAppError(legal.error) && legal.error.httpStatus === 404 ? 'This policy has not been published yet.' : 'The policy could not be loaded.'}
          onRetry={isAppError(legal.error) && legal.error.httpStatus === 404 ? undefined : () => void legal.refetch()}
        />
      ) : legal.data?.body ? (
        <AppText size={14} style={{lineHeight: 23}}>{legal.data.body}</AppText>
      ) : (
        <EmptyState title="Nothing published" body="This policy does not have any text yet." />
      )}
    </ScrollView>
  </Screen>;
}
