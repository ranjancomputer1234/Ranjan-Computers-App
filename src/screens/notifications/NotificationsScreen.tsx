import React from 'react';
import {Alert, FlatList, Pressable, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation} from '@react-navigation/native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey, isAuthenticated, useSessionStore} from '../../core/session';
import type {ContentRef, NotificationCategory, NotificationItem, Page} from '../../core/types';
import {createThemedStyles, colors, space} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {AppText, EmptyState, ErrorState, FilterChip, LoadingBlock} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {ClayCard, ClayIconTile} from '../../components/ui/Clay';
import type {HomeNav} from '../../navigation/types';
import type {IconName} from '../../assets/icons';
import {virtualizedListPerformanceProps} from '../../components/layout/listPerformance';

type Filter = 'all' | NotificationCategory;

const filters: {id: Filter; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'classes', label: 'Classes'},
  {id: 'tests', label: 'Tests'},
  {id: 'news', label: 'Updates'},
  {id: 'offers', label: 'Offers'},
];

function categoryMeta(category: NotificationCategory): {label: string; icon: IconName; color: string} {
  switch (category) {
    case 'classes': return {label: 'CLASS', icon: 'live', color: colors.primary};
    case 'tests': return {label: 'TEST', icon: 'clipboard', color: '#7B1FA2'};
    case 'news': return {label: 'UPDATE', icon: 'news', color: colors.success};
    case 'offers': return {label: 'OFFER', icon: 'gift', color: colors.orange};
    default: return {label: 'IMPORTANT', icon: 'bell', color: colors.error};
  }
}

function relativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)}h ago`;
  if (diffMinutes < 48 * 60) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, {day: 'numeric', month: 'short'}).format(new Date(timestamp));
}

export function NotificationsScreen() {
  const navigation = useNavigation<HomeNav>();
  const repos = useRepositories();
  const qc = useQueryClient();
  const theme = useTheme();
  const [filter, setFilter] = React.useState<Filter>('all');
  const status = useSessionStore(state => state.status);
  const userId = accountKey();
  const inboxKey = queryKeys.notifications(userId, {cat: 'all'});
  const query = useQuery({
    queryKey: inboxKey,
    queryFn: () => repos.account.notifications(undefined, 'all'),
    enabled: status === 'authenticated',
    refetchInterval: 60_000,
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: query.isRefetching && !query.isLoading,
    onRefresh: () => {
      query.refetch().catch(() => undefined);
    },
    enabled: status === 'authenticated',
  });

  const updateCachedReadState = React.useCallback((id?: string) => {
    qc.setQueriesData<Page<NotificationItem>>(
      {queryKey: ['learner', userId, 'notifications']},
      old => old ? {...old, items: old.items.map(item => !id || item.id === id ? {...item, read: true} : item)} : old,
    );
  }, [qc, userId]);

  const read = useMutation({
    mutationFn: (id: string) => repos.account.markRead(id),
    onMutate: id => updateCachedReadState(id),
    onError: () => void qc.invalidateQueries({queryKey: ['learner', userId, 'notifications']}),
    onSuccess: () => void qc.invalidateQueries({queryKey: queryKeys.home(userId)}),
  });
  const markAll = useMutation({
    mutationFn: () => repos.account.clearAll(),
    onMutate: () => updateCachedReadState(),
    onError: () => void qc.invalidateQueries({queryKey: ['learner', userId, 'notifications']}),
    onSuccess: () => {
      void qc.invalidateQueries({queryKey: ['learner', userId, 'notifications']});
      void qc.invalidateQueries({queryKey: queryKeys.home(userId)});
    },
  });

  const open = (item: NotificationItem) => {
    if (!item.read) read.mutate(item.id);
    const target = item.target;
    if (!target) return;
    if (!isAuthenticated() && ['document', 'test'].includes(target.kind)) {
      useSessionStore.getState().setPendingDestination(target);
      useSessionStore.getState().showLogin();
      return;
    }
    useSessionStore.getState().setPendingDestination(target as ContentRef);
  };

  if (status !== 'authenticated') {
    return <Screen><DetailHeader title="Notifications" onBack={() => navigation.goBack()} /><EmptyState title="Sign in to view your inbox" body="Class updates and account notifications will appear here." actionLabel="Sign in" onAction={() => useSessionStore.getState().showLogin()} /></Screen>;
  }

  const allItems = query.data?.items ?? [];
  const visibleItems = filter === 'all' ? allItems : allItems.filter(item => item.category === filter);
  const unreadCount = allItems.filter(item => !item.read).length;

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Notifications" subtitle={unreadCount ? `${unreadCount} unread` : 'You’re all caught up'} onBack={() => navigation.goBack()} />
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <View>
            <AppText weight="900" size={17} color={theme.colors.navy}>Your inbox</AppText>
            <AppText size={10.5} color={theme.colors.text2}>Updates from RACI and your learning activity</AppText>
          </View>
          {unreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              disabled={markAll.isPending}
              hitSlop={8}
              onPress={() => Alert.alert('Mark everything read?', 'All current inbox messages will remain available.', [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Mark read', onPress: () => markAll.mutate()},
              ])}>
              <AppText weight="800" size={11} color={theme.colors.primary}>Mark all read</AppText>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.chips}>
          {filters.map(item => (
            <FilterChip key={item.id} label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />
          ))}
        </View>
      </View>
      {query.isLoading ? <LoadingBlock label="Loading your inbox" /> : null}
      {query.isError ? <ErrorState message="Could not load notifications." onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <FlatList
          {...pullRefresh.scrollProps}
          {...virtualizedListPerformanceProps}
          data={visibleItems}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, visibleItems.length === 0 && styles.emptyList]}
          ListEmptyComponent={<EmptyState title={filter === 'all' ? 'No notifications yet' : `No ${filters.find(item => item.id === filter)?.label.toLowerCase()} notifications`} body="New messages will appear here when RACI has an update for you." />}
          renderItem={({item}) => {
            const meta = categoryMeta(item.category);
            return (
              <ClayCard variant={item.read ? 'white' : 'sky'} style={[styles.card, !item.read && styles.unreadCard]} onPress={() => open(item)}>
                <View style={styles.cardRow}>
                  <View>
                    <ClayIconTile icon={meta.icon} color={meta.color} size={44} />
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <View style={styles.copy}>
                    <View style={styles.metaRow}>
                      <AppText weight="900" size={8.5} color={meta.color} style={styles.category}>{meta.label}</AppText>
                      {item.source === 'admin' ? <AppText weight="700" size={8.5} color={theme.colors.text3}>RACI ADMIN</AppText> : null}
                      <AppText size={9} color={theme.colors.text3} style={styles.time}>{relativeTime(item.createdAt)}</AppText>
                    </View>
                    <AppText weight={item.read ? '700' : '900'} size={13.5} color={theme.colors.navy}>{item.title}</AppText>
                    <AppText size={11.5} color={theme.colors.text2} style={styles.body}>{item.body}</AppText>
                    {item.target ? <AppText weight="800" size={10} color={theme.colors.primary} style={styles.action}>{item.actionLabel ?? 'View details'}  ›</AppText> : null}
                  </View>
                </View>
              </ClayCard>
            );
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = createThemedStyles({
  toolbar: {paddingHorizontal: space.pageX, paddingTop: 12, gap: 13},
  titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  chips: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  list: {padding: space.pageX, gap: 11, paddingBottom: 32},
  emptyList: {flexGrow: 1, justifyContent: 'center'},
  card: {padding: 14},
  unreadCard: {borderLeftWidth: 3, borderLeftColor: colors.primary},
  cardRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  copy: {flex: 1, minWidth: 0, gap: 4},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 7},
  category: {letterSpacing: 0.7},
  time: {marginLeft: 'auto'},
  body: {lineHeight: 17},
  action: {marginTop: 3},
  unreadDot: {position: 'absolute', right: -2, top: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error, borderWidth: 2, borderColor: colors.white},
});
