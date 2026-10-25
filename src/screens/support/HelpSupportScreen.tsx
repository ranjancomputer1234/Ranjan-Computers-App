import React from 'react';
import {Linking, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {colors} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {Alert} from 'react-native';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {styles} from './styles';
import type {ProfileStackParamList} from '../../navigation/types';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function HelpSupportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const repos = useRepositories();
  const support = useQuery({queryKey: queryKeys.support(), queryFn: () => repos.account.support()});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: support.isRefetching,
    onRefresh: () => {
      support.refetch().catch(() => undefined);
    },
  });
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Help & Support" onBack={() => navigation.goBack()} />
      {support.isLoading ? <LoadingBlock /> : null}
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
        {support.isError ? <ErrorState message="Support information could not be loaded." onRetry={() => void support.refetch()} /> : null}
        {support.data?.faqs.map(item => (
          <ClayCard key={item.q} variant="white">
            <AppText weight="800">{item.q}</AppText>
            <AppText size={12} color={colors.text2}>{item.a}</AppText>
          </ClayCard>
        ))}
        {support.data?.email && !support.data.email.endsWith('.invalid') ? <ClayButton label="Email support" onPress={() => { void Linking.openURL(`mailto:${support.data!.email}`).catch(() => Alert.alert('Email support', support.data!.email)); }} /> : null}
        {support.data?.phone ? <ClayButton label="Call support" tone="ghost" onPress={() => { void Linking.openURL(`tel:${support.data!.phone}`).catch(() => Alert.alert('Call support', support.data!.phone)); }} /> : null}
        <ClayButton label="Send feedback" tone="ghost" onPress={() => navigation.navigate('Feedback')} />
      </ScrollView>
    </Screen>
  );
}
