import {createThemedStyles} from '../../theme';
import React,
  {useDeferredValue,
  useMemo,
  useState} from 'react';
import {
  FlatList,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {colors, space} from '../../theme';
import {AppText, ErrorState, FilterChip, SearchInput, LoadingBlock} from '../../components/ui';
import {BrandedHeader, Screen} from '../../components/layout/Screen';
import {CategoryCard, CourseCatalogCard} from '../../components/content/Cards';
import type {HomeNav} from '../../navigation/types';
import type {CatalogQuery} from '../../core/repositories';
import type {PricingFilter} from '../../core/types';
import {virtualizedListPerformanceProps} from '../../components/layout/listPerformance';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

const configs: Record<string, {title: string; subtitle: string; kind: CatalogQuery['kind']; search: string; all: string; onOpen: (nav: HomeNav, id: string) => void}> = {
  ComputerCourses: {title: 'Computer Courses', subtitle: 'Learn Computer Skills Step by Step', kind: 'course', search: 'Search computer courses', all: 'All Courses', onOpen: (nav, id) => nav.navigate('CourseDetail', {courseId: id})},
  CoursesHome: {title: 'Computer Courses', subtitle: 'Learn Computer Skills Step by Step', kind: 'course', search: 'Search computer courses', all: 'All Courses', onOpen: (nav, id) => nav.navigate('CourseDetail', {courseId: id})},
  CompetitiveExams: {title: 'Competitive Exams', subtitle: 'Prepare Today, Excel Tomorrow', kind: 'exam', search: 'Search exams', all: 'All Exams', onOpen: (nav, id) => nav.navigate('ExamDetail', {examId: id})},
  DailyNews: {title: 'Daily News', subtitle: 'Stay informed, stay ahead', kind: 'news', search: 'Search news topics', all: 'All News', onOpen: (nav, id) => nav.navigate('NewsFeed', {categoryId: id})},
  GeneralAwareness: {title: 'General Awareness', subtitle: 'Static GK for every exam', kind: 'topic', search: 'Search topics', all: 'All Topics', onOpen: (nav, id) => nav.navigate('TopicDetail', {topicId: id})},
  AmazingFacts: {title: 'Amazing Facts', subtitle: 'Curious things worth knowing', kind: 'fact', search: 'Search facts', all: 'All Facts', onOpen: (nav, id) => nav.navigate('FactsList', {categoryId: id})},
};

export function CatalogScreen() {
  const navigation = useNavigation<HomeNav>();
  const route = useRoute();
  const repos = useRepositories();
  const cfg = configs[route.name] ?? configs.ComputerCourses;
  const initial = ((route.params as {pricing?: PricingFilter} | undefined)?.pricing ?? 'all') as PricingFilter;
  const [pricing, setPricing] = useState<PricingFilter>(initial);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const {width, fontScale} = useWindowDimensions();
  const isCourseCatalog = cfg.kind === 'course';
  const columns = width < 360 || fontScale > 1.25 ? 1 : 2;
  const query = useInfiniteQuery({
    queryKey: queryKeys.catalog(cfg.kind, {search: deferredSearch, pricing}),
    initialPageParam: undefined as string | undefined,
    queryFn: ({pageParam}) => repos.catalog.list({kind: cfg.kind, search: deferredSearch, pricing, cursor: pageParam}),
    getNextPageParam: page => page.nextCursor ?? undefined,
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: query.isRefetching,
    onRefresh: () => {
      query.refetch().catch(() => undefined);
    },
  });
  const heading = useMemo(() => (cfg.kind === 'course' ? 'Choose a Course' : cfg.title), [cfg]);

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <BrandedHeader
        showBack={navigation.canGoBack()}
        onBack={() => navigation.goBack()}
        onSearch={() => navigation.navigate('Search')}
        onNotifications={showLearnerUnavailable}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        key={columns}
        data={query.data?.pages.flatMap(page => page.items) ?? []}
        keyExtractor={item => item.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.wrap : undefined}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => { if (query.hasNextPage && !query.isFetching) void query.fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={query.isFetchingNextPage ? <LoadingBlock /> : undefined}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={isCourseCatalog ? styles.courseTitleBlock : undefined}>
              {isCourseCatalog ? (
                <AppText weight="800" size={10} color={colors.primary} style={styles.eyebrow}>
                  BUILD PRACTICAL SKILLS
                </AppText>
              ) : null}
              <AppText weight="900" size={isCourseCatalog ? 25 : 22} color={colors.navy}>{cfg.title}</AppText>
              <AppText size={12.5} color={colors.text2} style={{marginTop: 6}}>{cfg.subtitle}</AppText>
            </View>
            <SearchInput
              flat={isCourseCatalog}
              placeholder={cfg.search}
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
            />
            {isCourseCatalog ? (
              <CoursePricingFilters value={pricing} onChange={setPricing} />
            ) : (
              <View style={styles.chips}>
                <FilterChip label={cfg.all} selected={pricing === 'all'} onPress={() => setPricing('all')} />
                <FilterChip label="Free" tone="free" selected={pricing === 'free'} onPress={() => setPricing('free')} />
                <FilterChip label="Paid" tone="paid" selected={pricing === 'paid'} onPress={() => setPricing('paid')} />
              </View>
            )}
            <View style={styles.sectionHeadingRow}>
              <AppText weight="800" size={16.5} color={colors.navy}>{heading}</AppText>
              {isCourseCatalog ? (
                <AppText weight="700" size={10.5} color={colors.text3}>
                  {pricing === 'all' ? 'FREE + PAID' : pricing.toUpperCase()}
                </AppText>
              ) : null}
            </View>
            {query.isError ? <ErrorState message="Could not load this catalogue." onRetry={() => query.refetch()} /> : null}
            {query.isLoading ? <LoadingBlock /> : null}
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.cell}>
            {isCourseCatalog ? (
              <CourseCatalogCard item={item} onPress={() => cfg.onOpen(navigation, item.targetId ?? item.id)} />
            ) : (
              <CategoryCard item={item} onPress={() => cfg.onOpen(navigation, item.targetId ?? item.id)} />
            )}
          </View>
        )}
        ListEmptyComponent={!query.isLoading && !query.isError ? <AppText color={colors.text2}>No items match these filters.</AppText> : undefined}
      />
    </Screen>
  );
}

function CoursePricingFilters({
  value,
  onChange,
}: {
  value: PricingFilter;
  onChange: (value: PricingFilter) => void;
}) {
  const options: Array<{value: PricingFilter; label: string}> = [
    {value: 'all', label: 'All'},
    {value: 'free', label: 'Free'},
    {value: 'paid', label: 'Paid'},
  ];

  return (
    <View style={styles.courseFilters} accessibilityRole="tablist">
      {options.map(option => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{selected}}
            onPress={() => onChange(option.value)}
            style={[
              styles.courseFilter,
              selected && styles.courseFilterSelected,
              selected && option.value === 'free' && styles.courseFilterFree,
              selected && option.value === 'paid' && styles.courseFilterPaid,
            ]}>
            <View
              style={[
                styles.filterDot,
                option.value === 'free'
                  ? styles.filterDotFree
                  : option.value === 'paid'
                    ? styles.filterDotPaid
                    : styles.filterDotAll,
              ]}
            />
            <AppText
              weight="800"
              size={12}
              color={
                selected && option.value === 'free'
                  ? colors.success
                  : selected && option.value === 'paid'
                    ? colors.orange
                    : colors.navy
              }>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = createThemedStyles({
  page: {paddingHorizontal: space.pageX, paddingTop: 14, paddingBottom: 26, gap: 11},
  wrap: {gap: 11},
  cell: {flex: 1, minWidth: 0},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 9},
  headerContent: {gap: 14, marginBottom: 4},
  courseTitleBlock: {paddingTop: 3},
  eyebrow: {letterSpacing: 1.25, marginBottom: 7},
  sectionHeadingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  courseFilters: {
    minHeight: 52,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DFE5EF',
    backgroundColor: '#F1F4F9',
    boxShadow:
      'inset 2px 2px 6px rgba(148, 163, 184, 0.18), inset -2px -2px 6px rgba(255, 255, 255, 0.75)',
  },
  courseFilter: {
    minHeight: 42,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 11,
  },
  courseFilterSelected: {
    backgroundColor: '#FFFFFF',
    boxShadow:
      '0 6px 12px -8px rgba(26, 35, 126, 0.34), inset 1px 1px 3px rgba(255, 255, 255, 0.8)',
  },
  courseFilterFree: {borderWidth: 1, borderColor: '#D4EAD8'},
  courseFilterPaid: {borderWidth: 1, borderColor: '#F5DDC2'},
  filterDot: {width: 7, height: 7, borderRadius: 4},
  filterDotAll: {backgroundColor: '#90A4AE'},
  filterDotFree: {backgroundColor: '#2E7D32'},
  filterDotPaid: {backgroundColor: '#F57C00'},
});
