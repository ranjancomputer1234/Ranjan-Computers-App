import {createThemedStyles} from '../../theme';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRepositories } from '../../core/di';
import { queryKeys } from '../../core/query';
import { getAccountScoped, setAccountScoped } from '../../core/storage';
import { accountKey } from '../../core/session';
import { appConfig } from '../../core/config';
import { clay, colors, radius, space } from '../../theme';
import {
  AppText,
  EmptyState,
  ErrorState,
  FilterChip,
  SearchInput,
  Skeleton,
} from '../../components/ui';
import { ClayCard, ClayIconTile, IconButton } from '../../components/ui/Clay';
import { Screen } from '../../components/layout/Screen';
import { Icon, type IconName } from '../../assets/icons';
import { speechService } from '../../core/services';
import type { HomeNav } from '../../navigation/types';
import { virtualizedListPerformanceProps } from '../../components/layout/listPerformance';
import type { CatalogItem } from '../../core/types';
import { usePullRefreshFeedback } from '../../components/ui/AppRefreshControl';

type SearchResult = CatalogItem & { badge: string };
type SearchType = 'COURSE' | 'TEST' | 'LIVE' | 'NEWS' | 'FACT' | 'INTERVIEW';

const SEARCH_TYPES: { label: string; value?: SearchType }[] = [
  { label: 'All' },
  { label: 'Courses', value: 'COURSE' },
];

const ListSeparator = () => <View style={styles.separator} />;

function ignoreRejection(promise: Promise<unknown>) {
  promise.catch(() => undefined);
}

const badgePalette: Record<string, { backgroundColor: string; color: string }> =
  {
    COURSE: {get backgroundColor() { return colors.pastel.blue; }, get color() { return clay.blue.icon; }},
    TEST: {get backgroundColor() { return colors.pastel.purple; }, get color() { return clay.purple.icon; }},
    LIVE: {get backgroundColor() { return colors.pastel.red; }, get color() { return clay.red.icon; }},
    NEWS: {get backgroundColor() { return colors.pastel.orange; }, get color() { return clay.orange.icon; }},
    FACT: {get backgroundColor() { return colors.pastel.green; }, get color() { return clay.green.icon; }},
    INTERVIEW: {get backgroundColor() { return colors.pastel.mint; }, get color() { return clay.mint.icon; }},
  };

function SearchResultCard({
  item,
  onPress,
}: {
  item: SearchResult;
  onPress: () => void;
}) {
  const badge = badgePalette[item.badge] ?? badgePalette.COURSE;
  return (
    <ClayCard
      variant={item.clay}
      onPress={onPress}
      padded={false}
      style={styles.resultCard}
    >
      <ClayIconTile
        icon={item.icon as IconName}
        color={item.iconColor ?? clay[item.clay].icon}
        letter={item.letter}
      />
      <View style={styles.resultBody}>
        <AppText weight="800" size={12} color={colors.navy} numberOfLines={2}>
          {item.title}
        </AppText>
        {item.subtitle ? (
          <AppText size={9.5} color={colors.text2} numberOfLines={1}>
            {item.subtitle}
          </AppText>
        ) : null}
      </View>
      <View
        style={[styles.typeBadge, { backgroundColor: badge.backgroundColor }]}
      >
        <AppText
          weight="800"
          size={8.5}
          color={badge.color}
          style={styles.typeBadgeText}
        >
          {item.badge}
        </AppText>
      </View>
    </ClayCard>
  );
}

function SearchChip({
  label,
  tone = 'recent',
  onPress,
}: {
  label: string;
  tone?: 'recent' | 'suggested';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Search for ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.searchChip,
        tone === 'suggested' && styles.searchChipSuggested,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.chipIcon}>
        <Icon name="refresh" size={12} color="#fff" />
      </View>
      <AppText
        weight="700"
        size={12}
        color={tone === 'suggested' ? '#EF6C00' : colors.success}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function SearchScreen() {
  const navigation = useNavigation<HomeNav>();
  const route = useRoute();
  const initial = (route.params as { query?: string } | undefined)?.query ?? '';
  const [q, setQ] = useState(initial);
  const [debounced, setDebounced] = useState(initial.trim());
  const [recent, setRecent] = useState<string[]>([]);
  const [type, setType] = useState<SearchType | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const repos = useRepositories();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    let mounted = true;
    getAccountScoped<string[]>(accountKey(), 'recentSearches', []).then(
      items => {
        if (mounted) setRecent(items);
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  const rememberSearch = useCallback(
    async (value: string) => {
      const normalized = value.trim();
      if (normalized.length < 2) return;
      const next = [
        normalized,
        ...recent.filter(
          item => item.toLowerCase() !== normalized.toLowerCase(),
        ),
      ].slice(0, 8);
      setRecent(next);
      await setAccountScoped(accountKey(), 'recentSearches', next);
    },
    [recent],
  );

  const clearRecent = useCallback(async () => {
    setRecent([]);
    await setAccountScoped(accountKey(), 'recentSearches', []);
  }, []);

  const chooseSearch = useCallback(
    (value: string) => {
      setQ(value);
      ignoreRejection(rememberSearch(value));
    },
    [rememberSearch],
  );

  const runVoiceSearch = useCallback(async () => {
    if (!speechService.available) {
      Alert.alert(
        'Voice search unavailable',
        'Voice search is not configured in this build. You can still type a course, test, or topic.',
      );
      return;
    }
    try {
      const text = await speechService.transcribe();
      chooseSearch(text);
    } catch (error) {
      Alert.alert(
        'Couldn’t hear that',
        error instanceof Error
          ? error.message
          : 'Please try voice search again or type your search.',
      );
    }
  }, [chooseSearch]);

  const search = useInfiniteQuery({
    queryKey: queryKeys.search(debounced, type),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      repos.catalog.search(debounced, type, pageParam),
    getNextPageParam: page => page.nextCursor ?? undefined,
    enabled: debounced.length > 1,
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: search.isRefetching,
    onRefresh: () => {
      search.refetch().catch(() => undefined);
    },
    enabled: debounced.length > 1,
  });

  const results = useMemo(
    () => search.data?.pages.flatMap(page => page.items) ?? [],
    [search.data],
  );
  const total = search.data?.pages[0]?.total ?? results.length;

  const open = async (item: SearchResult) => {
    await rememberSearch(debounced);
    const {kind, id} = item;
    if (kind === 'course')
      navigation.navigate('CourseDetail', { courseId: id });
    else if (kind === 'lesson')
      navigation.navigate('LessonPlayer', {courseId: item.courseId, lessonId: id});
    else showLearnerUnavailable();
  };

  const hasQuery = debounced.length > 1;

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <View style={styles.header}>
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        />
        <View style={styles.searchWrap}>
          <SearchInput
            value={q}
            placeholder="Search RACI"
            autoFocus
            onChangeText={setQ}
            onClear={() => {
              setQ('');
              setType(undefined);
            }}
            onSubmitEditing={() => {
              Keyboard.dismiss();
              ignoreRejection(rememberSearch(q));
            }}
          />
        </View>
        {appConfig.capabilities.speechSearch ? (
          <IconButton
            icon="mic"
            accessibilityLabel="Voice search"
            onPress={() => ignoreRejection(runVoiceSearch())}
          />
        ) : null}
      </View>

      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        data={results}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (search.hasNextPage && !search.isFetchingNextPage)
            ignoreRejection(search.fetchNextPage());
        }}
        keyExtractor={item => `${item.kind}-${item.id}`}
        contentContainerStyle={styles.page}
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {recent.length ? <View style={styles.recentSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                <FilterChip
                  label="Recent"
                  selected
                />
                {recent.map(
                  (item, index) => (
                    <SearchChip
                      key={item}
                      label={item}
                      tone={index === 2 ? 'suggested' : 'recent'}
                      onPress={() => chooseSearch(item)}
                    />
                  ),
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent searches"
                  onPress={() => ignoreRejection(clearRecent())}
                  hitSlop={8}
                  style={styles.clearRecent}
                >
                  <AppText weight="700" size={11} color={colors.primary}>
                    Clear
                  </AppText>
                </Pressable>
              </ScrollView>
            </View> : null}

            {!hasQuery ? (
              <View style={styles.discovery}>
                <View style={styles.searchHint}>
                  <View style={styles.hintIcon}>
                    <Icon name="search" size={23} color={colors.primary} />
                  </View>
                  <AppText weight="800" size={15} color={colors.navy} center>
                    Find your next lesson
                  </AppText>
                  <AppText size={12} color={colors.text2} center>
                    Search the courses and lessons currently published by RACI.
                  </AppText>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.sectionTitleRow}>
                  <AppText
                    weight="800"
                    size={16.5}
                    color={colors.navy}
                    style={styles.resultTitle}
                  >
                    {search.isLoading
                      ? 'Searching…'
                      : `${total} ${
                          total === 1 ? 'result' : 'results'
                        } for “${debounced}”`}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showFilters }}
                    onPress={() => setShowFilters(value => !value)}
                    hitSlop={8}
                  >
                    <AppText weight="700" size={11.5} color={colors.primary}>
                      Filters
                    </AppText>
                  </Pressable>
                </View>
                {showFilters ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                  >
                    {SEARCH_TYPES.map(option => (
                      <FilterChip
                        key={option.label}
                        label={option.label}
                        selected={type === option.value}
                        onPress={() => setType(option.value)}
                      />
                    ))}
                  </ScrollView>
                ) : null}
                {search.isLoading ? (
                  <View style={styles.loadingList}>
                    <Skeleton height={66} variant="blue" />
                    <Skeleton height={66} variant="red" />
                    <Skeleton height={66} variant="purple" />
                  </View>
                ) : null}
                {search.isError ? (
                  <ErrorState
                    message="Search failed. Check your connection and try again."
                    onRetry={() => search.refetch()}
                  />
                ) : null}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <SearchResultCard
            item={item}
            onPress={() => ignoreRejection(open(item))}
          />
        )}
        ListEmptyComponent={
          hasQuery && !search.isLoading && !search.isError ? (
            <EmptyState
              title="No matches found"
              body={`Try a shorter search, another spelling, or remove the ${
                type?.toLowerCase() ?? 'active'
              } filter.`}
              actionLabel={type ? 'Show all types' : 'Clear search'}
              onAction={() => (type ? setType(undefined) : setQ(''))}
            />
          ) : undefined
        }
        ListFooterComponent={
          results.length ? (
            search.isFetchingNextPage ? (
              <Skeleton height={66} variant="blue" />
            ) : !search.hasNextPage ? (
              <AppText
                size={11.5}
                color={colors.text3}
                center
                style={styles.endText}
              >
                — no more results —
              </AppText>
            ) : undefined
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = createThemedStyles({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(26,35,126,0.06)',
  },
  searchWrap: { flex: 1, minWidth: 0 },
  page: { padding: space.pageX, paddingBottom: 28, flexGrow: 1 },
  listHeader: { gap: 14, marginBottom: 12 },
  recentSection: { gap: 10 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultTitle: { flex: 1, minWidth: 0 },
  chips: { gap: 9, paddingRight: 8, alignItems: 'center' },
  clearRecent: {
    minHeight: 40,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  searchChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    backgroundColor: colors.pastel.green,
    boxShadow: '0 8px 14px -7px rgba(46,125,50,0.45)',
  },
  searchChipSuggested: {
    backgroundColor: colors.pastel.orange,
    boxShadow: '0 8px 14px -7px rgba(245,124,0,0.42)',
  },
  chipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successAccent,
  },
  pressed: { opacity: 0.82 },
  discovery: { gap: 12 },
  searchHint: {
    marginTop: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 8,
  },
  hintIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pastel.blue,
  },
  filterRow: { gap: 8, paddingRight: 8 },
  loadingList: { gap: 11 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    minHeight: 66,
  },
  resultBody: { flex: 1, minWidth: 0, gap: 5 },
  typeBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.chip,
    flexShrink: 0,
  },
  typeBadgeText: { letterSpacing: 0.8 },
  separator: { height: 11 },
  endText: { paddingVertical: 20 },
});
