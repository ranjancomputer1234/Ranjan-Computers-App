import React from 'react';
import {Alert, Pressable, ScrollView, SectionList, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation} from '@react-navigation/native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Icon} from '../../assets/icons';
import {isFeatureUnavailable} from '../../core/api/http';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey, isAuthenticated, useSessionStore} from '../../core/session';
import type {ContentRef, NotificationCategory, NotificationItem, Page} from '../../core/types';
import {clay, colors, createThemedStyles, gradients, radius, space} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {AppText, ClayButton, EmptyState, ErrorState, LoadingBlock} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {ClayCard} from '../../components/ui/Clay';
import {Gradient} from '../../components/ui/Gradient';
import type {HomeNav} from '../../navigation/types';
import type {IconName} from '../../assets/icons';
import {virtualizedListPerformanceProps} from '../../components/layout/listPerformance';

type Filter = 'all' | NotificationCategory;
type DayBucket = 'Today' | 'Yesterday' | 'Earlier';

const filters: {id: Filter; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'classes', label: 'Classes'},
  {id: 'tests', label: 'Tests'},
  {id: 'news', label: 'Updates'},
  {id: 'offers', label: 'Offers'},
];

const dayOrder: DayBucket[] = ['Today', 'Yesterday', 'Earlier'];

function categoryMeta(category: NotificationCategory): {label: string; icon: IconName; color: string; wash: string} {
  switch (category) {
    case 'classes':
      return {label: 'Class', icon: 'live', color: clay.blue.icon, wash: colors.pastel.blue};
    case 'tests':
      return {label: 'Test', icon: 'clipboard', color: clay.purple.icon, wash: colors.pastel.purple};
    case 'news':
      return {label: 'Update', icon: 'news', color: clay.green.icon, wash: colors.pastel.green};
    case 'offers':
      return {label: 'Offer', icon: 'gift', color: clay.orange.icon, wash: colors.pastel.orange};
    default:
      return {label: 'Account', icon: 'bell', color: clay.red.icon, wash: colors.pastel.red};
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

function dayBucket(value: string): DayBucket {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Earlier';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startOfToday) return 'Today';
  if (timestamp >= startOfToday - 86_400_000) return 'Yesterday';
  return 'Earlier';
}

function groupByDay(items: NotificationItem[]): {title: DayBucket; data: NotificationItem[]}[] {
  const sorted = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const groups = new Map<DayBucket, NotificationItem[]>();
  for (const item of sorted) {
    const bucket = dayBucket(item.createdAt);
    const current = groups.get(bucket);
    if (current) current.push(item);
    else groups.set(bucket, [item]);
  }
  return dayOrder.filter(title => groups.has(title)).map(title => ({title, data: groups.get(title) ?? []}));
}

function InboxChip({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  const content = (
    <View style={styles.chipInner}>
      <AppText weight="800" size={12.5} color={selected ? '#fff' : colors.navy}>
        {label}
      </AppText>
      {count > 0 ? (
        <View style={[styles.countBadge, selected ? styles.countBadgeOn : styles.countBadgeOff]}>
          <AppText weight="800" size={10} color={selected ? colors.primary : colors.navy}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  if (selected) {
    return (
      <Pressable accessibilityRole="button" accessibilityState={{selected: true}} onPress={onPress}>
        <Gradient colors={gradients.primaryButton} style={styles.chip}>
          {content}
        </Gradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: false}}
      onPress={onPress}
      style={({pressed}) => [styles.chip, styles.chipIdle, pressed && {opacity: 0.82}]}>
      {content}
    </Pressable>
  );
}

function NotificationRow({item, onPress}: {item: NotificationItem; onPress: () => void}) {
  const theme = useTheme();
  const meta = categoryMeta(item.category);
  const when = relativeTime(item.createdAt);

  return (
    <ClayCard
      variant={item.read ? 'white' : 'sky'}
      padded={false}
      onPress={onPress}
      accessibilityLabel={`${item.read ? '' : 'Unread. '}${meta.label}. ${item.title}. ${when}`}
      style={styles.card}>
      {!item.read ? <View style={[styles.rail, {backgroundColor: meta.color}]} /> : null}
      <View style={styles.cardRow}>
        <View style={[styles.iconWash, {backgroundColor: meta.wash}]}>
          <Icon name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText
              weight={item.read ? '700' : '800'}
              size={14.5}
              color={theme.colors.navy}
              numberOfLines={2}
              style={styles.title}>
              {item.title}
            </AppText>
            <View style={styles.timeWrap}>
              {!item.read ? <View style={[styles.unreadPip, {backgroundColor: meta.color}]} /> : null}
              <AppText size={11} weight="600" color={theme.colors.text3}>
                {when}
              </AppText>
            </View>
          </View>
          <AppText size={12.5} color={theme.colors.text2} numberOfLines={2} style={styles.body}>
            {item.body}
          </AppText>
          <View style={styles.pills}>
            <View style={[styles.pill, {backgroundColor: meta.wash}]}>
              <AppText weight="800" size={10} color={meta.color}>
                {meta.label}
              </AppText>
            </View>
            {item.priority === 'high' ? (
              <View style={[styles.pill, {backgroundColor: colors.pastel.red}]}>
                <AppText weight="800" size={10} color={colors.error}>
                  Important
                </AppText>
              </View>
            ) : null}
            {item.source === 'admin' ? (
              <View style={[styles.pill, {backgroundColor: colors.pastel.indigo}]}>
                <AppText weight="800" size={10} color={theme.colors.navy}>
                  From RACI
                </AppText>
              </View>
            ) : null}
          </View>
          {item.target ? (
            <View style={styles.action}>
              <AppText weight="800" size={12} color={theme.colors.primary}>
                {item.actionLabel ?? 'View details'}
              </AppText>
              <Icon name="chev" size={14} color={theme.colors.primary} />
            </View>
          ) : null}
        </View>
      </View>
    </ClayCard>
  );
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

  const confirmMarkAll = () => {
    Alert.alert('Mark everything read?', 'All current inbox messages will remain available.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Mark read', onPress: () => markAll.mutate()},
    ]);
  };

  if (status !== 'authenticated') {
    return (
      <Screen>
        <DetailHeader title="Notifications" subtitle="Sign in required" onBack={() => navigation.goBack()} />
        <View style={styles.guest}>
          <ClayCard variant="sky" style={styles.guestCard}>
            <View style={[styles.guestIcon, {backgroundColor: theme.colors.white}]}>
              <Icon name="bell" size={22} color={theme.colors.primary} />
            </View>
            <AppText weight="900" size={18} color={theme.colors.navy} center>
              Your inbox lives here
            </AppText>
            <AppText size={13} color={theme.colors.text2} center style={styles.guestBody}>
              Sign in to see class reminders, test alerts, and updates from RACI.
            </AppText>
            <ClayButton label="Sign in" onPress={() => useSessionStore.getState().showLogin()} />
          </ClayCard>
        </View>
      </Screen>
    );
  }

  const allItems = query.data?.items ?? [];
  const visibleItems = filter === 'all' ? allItems : allItems.filter(item => item.category === filter);
  const unreadCount = allItems.filter(item => !item.read).length;
  const unreadByFilter: Record<Filter, number> = {all: unreadCount, classes: 0, tests: 0, news: 0, offers: 0, system: 0};
  for (const item of allItems) {
    if (!item.read) unreadByFilter[item.category] += 1;
  }
  const sections = groupByDay(visibleItems);
  const inboxReady = !query.isLoading && !query.isError;
  const headerSubtitle = query.isError
    ? 'Inbox unavailable'
    : unreadCount
      ? `${unreadCount} unread`
      : 'You’re all caught up';

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Notifications" subtitle={headerSubtitle} onBack={() => navigation.goBack()} />
      {query.isLoading ? <LoadingBlock label="Loading your inbox" /> : null}
      {query.isError ? (
        <ErrorState
          message={isFeatureUnavailable(query.error) ? 'The notification inbox is not available in the app yet.' : 'Could not load notifications.'}
          onRetry={isFeatureUnavailable(query.error) ? undefined : () => query.refetch()}
        />
      ) : null}
      {inboxReady ? (
        <SectionList
          {...pullRefresh.scrollProps}
          {...virtualizedListPerformanceProps}
          sections={sections}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={[styles.list, visibleItems.length === 0 && styles.emptyList]}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {unreadCount > 0 ? (
                <Gradient colors={gradients.banner} style={styles.hero}>
                  <View style={styles.heroCopy}>
                    <AppText weight="900" size={32} color="#fff" style={styles.heroCount}>
                      {unreadCount}
                    </AppText>
                    <AppText weight="700" size={13} color="rgba(255,255,255,0.92)">
                      {unreadCount === 1 ? 'update waiting' : 'updates waiting'}
                    </AppText>
                    <AppText size={11.5} color="rgba(255,255,255,0.78)" style={styles.heroHint}>
                      Classes, tests, and messages from RACI
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mark all notifications read"
                    disabled={markAll.isPending}
                    onPress={confirmMarkAll}
                    style={({pressed}) => [styles.markPill, (pressed || markAll.isPending) && {opacity: 0.72}]}>
                    <Icon name="check" size={13} color={colors.primary} />
                    <AppText weight="800" size={12} color={colors.primary}>
                      Mark all read
                    </AppText>
                  </Pressable>
                </Gradient>
              ) : allItems.length > 0 ? (
                <ClayCard variant="mint" padded={false} style={styles.caught}>
                  <View style={[styles.caughtIcon, {backgroundColor: theme.colors.white}]}>
                    <Icon name="check" size={16} color={theme.colors.success} />
                  </View>
                  <View style={styles.caughtCopy}>
                    <AppText weight="800" size={14.5} color={theme.colors.navy}>
                      You’re all caught up
                    </AppText>
                    <AppText size={12} color={theme.colors.text2}>
                      New class, test, and institute updates will land here.
                    </AppText>
                  </View>
                </ClayCard>
              ) : null}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}>
                {filters.map(item => (
                  <InboxChip
                    key={item.id}
                    label={item.label}
                    count={unreadByFilter[item.id]}
                    selected={filter === item.id}
                    onPress={() => setFilter(item.id)}
                  />
                ))}
              </ScrollView>
            </View>
          }
          renderSectionHeader={({section}) => (
            <View style={styles.sectionHead}>
              <AppText weight="800" size={12} color={theme.colors.text3}>
                {section.title}
              </AppText>
              <AppText weight="700" size={11} color={theme.colors.text3}>
                {section.data.length}
              </AppText>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title={filter === 'all' ? 'No notifications yet' : `No ${filters.find(item => item.id === filter)?.label.toLowerCase()} notifications`}
              body="New messages will appear here when RACI has an update for you."
            />
          }
          renderItem={({item}) => <NotificationRow item={item} onPress={() => open(item)} />}
        />
      ) : null}
    </Screen>
  );
}

const styles = createThemedStyles({
  guest: {flex: 1, justifyContent: 'center', paddingHorizontal: space.pageX, paddingBottom: 28},
  guestCard: {alignItems: 'center', gap: 10, paddingVertical: 26, paddingHorizontal: 18},
  guestIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  guestBody: {lineHeight: 19, marginBottom: 6},
  list: {paddingHorizontal: space.pageX, paddingBottom: 32},
  emptyList: {flexGrow: 1},
  headerBlock: {gap: 14, paddingTop: 14, paddingBottom: 4},
  hero: {
    borderRadius: radius.hero,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroCopy: {flex: 1, minWidth: 0},
  heroCount: {lineHeight: 36, letterSpacing: -0.6},
  heroHint: {marginTop: 2},
  markPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  caught: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  caughtIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caughtCopy: {flex: 1, minWidth: 0, gap: 2},
  chips: {gap: 8, paddingRight: 4},
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.chip,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipIdle: {backgroundColor: colors.white, borderWidth: 1, borderColor: colors.progressTrack},
  chipInner: {flexDirection: 'row', alignItems: 'center', gap: 7},
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeOn: {backgroundColor: '#fff'},
  countBadgeOff: {backgroundColor: colors.pastel.blue},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.scroll,
  },
  card: {padding: 14, marginBottom: 10, overflow: 'hidden'},
  rail: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  cardRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  iconWash: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {flex: 1, minWidth: 0, gap: 5},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  title: {flex: 1, lineHeight: 19},
  timeWrap: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 2},
  unreadPip: {width: 7, height: 7, borderRadius: 4},
  body: {lineHeight: 18},
  pills: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 1},
  pill: {borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8},
  action: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, marginTop: 2},
});
