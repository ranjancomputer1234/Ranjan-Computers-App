import {createThemedStyles} from '../../theme';
import React,
  {useState} from 'react';
import {
  ScrollView,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey} from '../../core/session';
import {colors, space} from '../../theme';
import {AppText, EmptyState, ErrorState, FilterChip, LoadingBlock, ProgressBar} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../../navigation/types';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function DownloadsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const repos = useRepositories();
  const [chip, setChip] = useState('All');
  const files = useQuery({queryKey: queryKeys.downloads(accountKey()), queryFn: () => repos.account.downloads()});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: files.isRefetching,
    onRefresh: () => {
      files.refetch().catch(() => undefined);
    },
  });
  const bytes = files.data?.reduce((sum, item) => sum + item.bytes, 0) ?? 0;
  const visible = files.data?.filter(item => chip === 'All' || item.kind === chip.toLowerCase()) ?? [];
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Downloads" onBack={() => navigation.goBack()} />
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
        <ClayCard variant="sky">
          <AppText weight="800">App download usage</AppText>
          <AppText size={12} color={colors.text2}>{(bytes / (1024 * 1024)).toFixed(1)} MB measured from the local download manifest. This is not a fake 1.2 GB quota.</AppText>
          <ProgressBar percent={Math.min(100, bytes / (200 * 1024 * 1024) * 100)} />
        </ClayCard>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
          {['All', 'Videos', 'Notes', 'PDFs'].map(item => (
            <FilterChip key={item} label={item} selected={chip === item} onPress={() => setChip(item)} />
          ))}
        </View>
        {files.isLoading ? <LoadingBlock /> : null}
        {files.isError ? <ErrorState message="Downloads could not be loaded." onRetry={() => void files.refetch()} /> : null}
        {visible.map(item => (
          <ClayCard key={item.id} variant="white">
            <AppText weight="800">{item.title}</AppText>
            <AppText size={11} color={colors.text2}>{item.status} · {(item.bytes / 1024 / 1024).toFixed(1)} MB</AppText>
            {item.status === 'downloading' ? <ProgressBar percent={item.progress * 100} height={7} /> : null}
          </ClayCard>
        ))}
        {!files.isLoading && !files.isError && !visible.length ? (
          <EmptyState
            title={chip === 'All' ? 'No downloads yet' : `No ${chip.toLowerCase()} downloaded`}
            body={chip === 'All' ? 'Downloaded lessons and resources will appear here.' : 'Choose another file type or download a resource first.'}
            actionLabel={chip === 'All' ? undefined : 'Show all downloads'}
            onAction={chip === 'All' ? undefined : () => setChip('All')}
          />
        ) : null}
        <ClayCard variant="yellow">
          <AppText size={12}>Wi-Fi-only is respected by the download queue. Background continuation depends on the OS and is documented, not promised indefinitely.</AppText>
        </ClayCard>
      </ScrollView>
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {padding: space.pageX, gap: 12, paddingBottom: 26},
});
