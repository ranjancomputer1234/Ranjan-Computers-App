import {createThemedStyles} from '../../theme';
import React,
  {useDeferredValue,
  useMemo,
  useState} from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {Icon, type IconName} from '../../assets/icons';
import {BrandedHeader, Screen} from '../../components/layout/Screen';
import {
  AppText,
  EmptyState,
  ErrorState,
  Gradient,
  LoadingBlock,
  ProgressBar,
  SearchInput,
} from '../../components/ui';
import {ClayCard, ClayIconTile} from '../../components/ui/Clay';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import type {CatalogItem} from '../../core/types';
import {useDailyAwarenessGoal} from '../../features/awareness';
import type {HomeNav} from '../../navigation/types';
import {clay, colors, space} from '../../theme';
import {virtualizedListPerformanceProps} from '../../components/layout/listPerformance';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

type Track = 'all' | 'geography' | 'governance' | 'heritage' | 'essentials';

const TRACKS: {id: Track; label: string}[] = [
  {id: 'all', label: 'All topics'},
  {id: 'geography', label: 'Geography'},
  {id: 'governance', label: 'Governance'},
  {id: 'heritage', label: 'History & culture'},
  {id: 'essentials', label: 'Quick facts'},
];

const TOPIC_TRACK: Record<string, Exclude<Track, 'all'>> = {
  'aw-states-uts': 'geography',
  'aw-capitals': 'geography',
  'aw-rivers': 'geography',
  'aw-dams': 'geography',
  'aw-wildlife': 'geography',
  'aw-parks': 'geography',
  'aw-mountains': 'geography',
  'aw-lakes': 'geography',
  'aw-geo': 'geography',
  'aw-constitution': 'governance',
  'aw-polity': 'governance',
  'aw-economy': 'governance',
  'aw-history': 'heritage',
  'aw-culture': 'heritage',
  'aw-awards': 'essentials',
  'aw-days': 'essentials',
};

function readingMinutes(item: CatalogItem): number {
  return 4 + (item.title.length % 5);
}

function TopicCard({
  item,
  studied,
  onPress,
}: {
  item: CatalogItem;
  studied: boolean;
  onPress: () => void;
}) {
  const unlocked = item.access.state === 'granted';
  const iconColor = item.iconColor ?? clay[item.clay].icon;
  return (
    <ClayCard
      variant={item.clay}
      padded={false}
      onPress={onPress}
      style={styles.topicCard}>
      <View style={styles.topicTop}>
        <ClayIconTile
          icon={item.icon as IconName}
          color={iconColor}
          letter={item.letter}
          size={43}
        />
        <View
          style={[
            styles.accessDot,
            {
              backgroundColor: studied
                ? colors.success
                : unlocked
                  ? colors.white
                  : colors.pastel.orange,
            },
          ]}>
          <Icon
            name={studied ? 'check' : unlocked ? 'bookopen' : 'lock'}
            size={13}
            color={studied ? '#FFFFFF' : unlocked ? colors.primary : colors.orange}
            strokeWidth={2.4}
          />
        </View>
      </View>
      <AppText
        weight="800"
        size={13}
        color={colors.navy}
        numberOfLines={2}
        style={styles.topicTitle}>
        {item.title}
      </AppText>
      <View style={styles.topicMeta}>
        <Icon name="clock" size={12} color={colors.text2} />
        <AppText size={10.5} weight="600" color={colors.text2}>
          {readingMinutes(item)} min
        </AppText>
        <View style={styles.metaDot} />
        <AppText
          size={10.5}
          weight="700"
          color={unlocked ? colors.success : colors.orange}>
          {unlocked ? (studied ? 'Reviewed' : 'Ready') : 'Premium'}
        </AppText>
      </View>
    </ClayCard>
  );
}

export function GeneralAwarenessScreen() {
  const navigation = useNavigation<HomeNav>();
  const repos = useRepositories();
  const {width, fontScale} = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.25 ? 1 : 2;
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [track, setTrack] = useState<Track>('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const {goal, studiedIds, studiedCount, goalPercent, markStudied} =
    useDailyAwarenessGoal();

  const query = useInfiniteQuery({
    queryKey: queryKeys.catalog('topic', {search: deferredSearch, pricing: freeOnly ? 'free' : 'all'}),
    initialPageParam: undefined as string | undefined,
    queryFn: ({pageParam}) =>
      repos.catalog.list({
        kind: 'topic',
        search: deferredSearch,
        pricing: freeOnly ? 'free' : 'all',
        cursor: pageParam,
      }),
    getNextPageParam: page => page.nextCursor ?? undefined,
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: query.isRefetching,
    onRefresh: () => {
      query.refetch().catch(() => undefined);
    },
  });

  const allTopics = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data],
  );
  const topics = useMemo(
    () =>
      track === 'all'
        ? allTopics
        : allTopics.filter(item => TOPIC_TRACK[item.id] === track),
    [allTopics, track],
  );
  const availableTopics = useMemo(
    () => allTopics.filter(item => item.access.state === 'granted'),
    [allTopics],
  );

  const openTopic = React.useCallback(
    (item: CatalogItem) => {
      markStudied(item.id);
      navigation.navigate('TopicDetail', {topicId: item.id});
    },
    [markStudied, navigation],
  );

  const smartTopic = useMemo(() => {
    const unread = availableTopics.find(item => !studiedIds.includes(item.id));
    return unread ?? availableTopics[studiedCount % Math.max(availableTopics.length, 1)];
  }, [availableTopics, studiedCount, studiedIds]);

  const surpriseMe = () => {
    if (!availableTopics.length) return;
    const seed = new Date().getDate() + studiedCount + availableTopics.length;
    openTopic(availableTopics[seed % availableTopics.length]);
  };

  const resetFilters = () => {
    setSearch('');
    setTrack('all');
    setFreeOnly(false);
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <BrandedHeader
        showBack
        onBack={() => navigation.goBack()}
        onSearch={() => navigation.navigate('Search', {query: search || undefined})}
        onNotifications={showLearnerUnavailable}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        key={columns}
        data={topics}
        keyExtractor={item => item.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.topicRow : undefined}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={query.isFetchingNextPage ? <LoadingBlock /> : undefined}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <AppText weight="900" size={23} color={colors.navy}>
                  General Awareness
                </AppText>
                <AppText size={12.5} color={colors.text2} style={styles.subtitle}>
                  Learn the facts that show up everywhere.
                </AppText>
              </View>
              <View style={styles.streakPill}>
                <Icon name="zap" size={14} color="#D97706" filled />
                <AppText size={11} weight="800" color="#92400E">
                  Daily
                </AppText>
              </View>
            </View>

            <Gradient
              colors={['#172554', '#1D4ED8', '#38BDF8']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.hero}>
              <View style={styles.heroGlowOne} />
              <View style={styles.heroGlowTwo} />
              <View style={styles.heroContent}>
                <View style={styles.heroEyebrow}>
                  <Icon name="target" size={13} color="#BAE6FD" />
                  <AppText
                    size={10}
                    weight="800"
                    color="#E0F2FE"
                    style={styles.eyebrowText}>
                    TODAY&apos;S 3-TOPIC SPRINT
                  </AppText>
                </View>
                <AppText weight="900" size={20} color="#FFFFFF">
                  {goalPercent >= 100 ? 'Daily goal complete!' : 'Build a sharper GK habit'}
                </AppText>
                <AppText size={11.5} color="rgba(255,255,255,0.82)" style={styles.heroBody}>
                  {goalPercent >= 100
                    ? 'Great work. Keep exploring or revise a topic you enjoyed.'
                    : 'One focused topic at a time—short enough for any study break.'}
                </AppText>
                <View style={styles.goalRow}>
                  <ProgressBar percent={goalPercent} height={7} />
                  <AppText size={10.5} weight="800" color="#FFFFFF">
                    {Math.min(studiedCount, goal)}/{goal}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={!smartTopic}
                  onPress={() => smartTopic && openTopic(smartTopic)}
                  style={({pressed}) => [styles.heroButton, pressed && styles.pressed]}>
                  <AppText size={12} weight="900" color="#1E3A8A">
                    {studiedCount ? 'Continue sprint' : 'Start daily sprint'}
                  </AppText>
                  <Icon name="chev" size={14} color="#1E3A8A" />
                </Pressable>
              </View>
              <View style={styles.heroIcon}>
                <Icon name="globe" size={54} color="rgba(255,255,255,0.9)" strokeWidth={1.45} />
                <View style={styles.heroSpark}>
                  <Icon name="star" size={17} color="#FDE68A" filled />
                </View>
              </View>
            </Gradient>

            <View style={styles.quickRow}>
              <ClayCard
                variant="lavender"
                padded={false}
                onPress={surpriseMe}
                style={styles.quickCard}>
                <View style={styles.quickIcon}>
                  <Icon name="refresh" size={17} color="#6D28D9" />
                </View>
                <View style={styles.quickCopy}>
                  <AppText weight="800" size={12} color={colors.navy}>
                    Surprise me
                  </AppText>
                  <AppText size={9.5} color={colors.text2}>
                    Pick a ready topic
                  </AppText>
                </View>
                <Icon name="chev" size={13} color="#7C3AED" />
              </ClayCard>
              <ClayCard
                variant="green"
                padded={false}
                onPress={() => setFreeOnly(current => !current)}
                style={[styles.quickCard, freeOnly && styles.quickSelected]}>
                <View style={styles.quickIcon}>
                  <Icon name={freeOnly ? 'check' : 'bookopen'} size={17} color={colors.success} />
                </View>
                <View style={styles.quickCopy}>
                  <AppText weight="800" size={12} color={colors.navy}>
                    Free library
                  </AppText>
                  <AppText size={9.5} color={colors.text2}>
                    {freeOnly ? 'Filter is on' : 'Learn without limits'}
                  </AppText>
                </View>
              </ClayCard>
            </View>

            <SearchInput
              placeholder="Search topics, places or subjects"
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tracks}>
              {TRACKS.map(option => {
                const selected = option.id === track;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{selected}}
                    onPress={() => setTrack(option.id)}
                    style={[styles.trackChip, selected && styles.trackChipSelected]}>
                    <AppText
                      size={11.5}
                      weight="700"
                      color={selected ? '#FFFFFF' : colors.text2}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionRow}>
              <View>
                <AppText weight="900" size={16.5} color={colors.navy}>
                  {track === 'all'
                    ? freeOnly
                      ? 'Free topics'
                      : 'Explore topics'
                    : TRACKS.find(item => item.id === track)?.label}
                </AppText>
                <AppText size={10.5} color={colors.text2} style={styles.sectionHint}>
                  {topics.length} {topics.length === 1 ? 'topic' : 'topics'} available
                </AppText>
              </View>
              {(search || track !== 'all' || freeOnly) && (
                <Pressable onPress={resetFilters} hitSlop={8}>
                  <AppText size={11.5} weight="800" color={colors.primary}>
                    Reset
                  </AppText>
                </Pressable>
              )}
            </View>
            {query.isError ? (
              <ErrorState
                message="We could not load awareness topics."
                onRetry={() => query.refetch()}
              />
            ) : null}
            {query.isLoading ? <LoadingBlock /> : null}
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.topicCell}>
            <TopicCard
              item={item}
              studied={studiedIds.includes(item.id)}
              onPress={() => openTopic(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          !query.isLoading && !query.isError ? (
            <EmptyState
              title="No topics found"
              body="Try another subject or clear your search."
              actionLabel="Reset filters"
              onAction={resetFilters}
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {
    paddingHorizontal: space.pageX,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerContent: {gap: 15, marginBottom: 13},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  titleCopy: {flex: 1, minWidth: 0},
  subtitle: {marginTop: 5},
  streakPill: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hero: {
    minHeight: 214,
    borderRadius: 24,
    padding: 17,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  heroContent: {flex: 1, zIndex: 2, gap: 9},
  heroEyebrow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  eyebrowText: {letterSpacing: 0.8},
  heroBody: {maxWidth: 255, lineHeight: 17},
  goalRow: {flexDirection: 'row', alignItems: 'center', gap: 9, maxWidth: 230},
  heroButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  pressed: {opacity: 0.85},
  heroIcon: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heroSpark: {position: 'absolute', top: 38, right: 2},
  heroGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -38,
    top: -55,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: 'rgba(125,211,252,0.12)',
    right: 24,
    bottom: -70,
  },
  quickRow: {flexDirection: 'row', gap: 10},
  quickCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  quickSelected: {borderWidth: 1.5, borderColor: '#66BB6A'},
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quickCopy: {flex: 1, minWidth: 0, gap: 3},
  tracks: {gap: 8, paddingRight: 10},
  trackChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: 'rgba(26,35,126,0.06)',
  },
  trackChipSelected: {backgroundColor: colors.primary, borderColor: colors.primary},
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionHint: {marginTop: 3},
  topicRow: {gap: 11},
  topicCell: {flex: 1, minWidth: 0, marginBottom: 11},
  topicCard: {minHeight: 142, padding: 12, gap: 10},
  topicTop: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  accessDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: {minHeight: 34, lineHeight: 17},
  topicMeta: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto'},
  metaDot: {width: 3, height: 3, borderRadius: 2, backgroundColor: colors.text3},
});
