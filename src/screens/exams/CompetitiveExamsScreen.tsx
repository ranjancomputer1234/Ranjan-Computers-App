import {createThemedStyles} from '../../theme';
import React, {useDeferredValue, useMemo, useState} from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import type {Exam, PricingFilter, TestDefinition} from '../../core/types';
import type {HomeNav} from '../../navigation/types';
import {Icon, type IconName} from '../../assets/icons';
import {BrandedHeader, Screen} from '../../components/layout/Screen';
import {
  AccessBadge,
  AppText,
  EmptyState,
  ErrorState,
  LoadingBlock,
  SearchInput,
} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {clay, colors, radius, space, type ClayVariant} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {virtualizedListPerformanceProps} from '../../components/layout/listPerformance';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

type ExamCategory = 'all' | 'banking' | 'government' | 'railway' | 'teaching' | 'entrance';
type ExamSort = 'recommended' | 'tests' | 'alphabetical';

const categories: {key: ExamCategory; label: string; icon: IconName}[] = [
  {key: 'all', label: 'All', icon: 'target'},
  {key: 'government', label: 'Govt.', icon: 'capitol'},
  {key: 'banking', label: 'Banking', icon: 'bank'},
  {key: 'railway', label: 'Railway', icon: 'train'},
  {key: 'teaching', label: 'Teaching', icon: 'teacher'},
  {key: 'entrance', label: 'Entrance', icon: 'gradcap'},
];

const sortOptions: {key: ExamSort; label: string}[] = [
  {key: 'recommended', label: 'Recommended'},
  {key: 'tests', label: 'Most tests'},
  {key: 'alphabetical', label: 'A–Z'},
];

const examDetails: Record<
  string,
  {category: Exclude<ExamCategory, 'all'>; summary: string}
> = {
  'exam-banking': {category: 'banking', summary: 'IBPS, SBI, RBI and insurance'},
  'exam-ssc': {category: 'government', summary: 'CGL, CHSL, MTS and GD'},
  'exam-railway': {category: 'railway', summary: 'RRB NTPC, Group D and ALP'},
  'exam-jpsc': {category: 'government', summary: 'Prelims, mains and Jharkhand GK'},
  'exam-bpsc': {category: 'government', summary: 'Prelims, mains and Bihar GK'},
  'exam-upsc': {category: 'government', summary: 'Civil services complete preparation'},
  'exam-jssc': {category: 'government', summary: 'Jharkhand state recruitment'},
  'exam-police': {category: 'government', summary: 'Constable and SI preparation'},
  'exam-ctet': {category: 'teaching', summary: 'CTET, TET and pedagogy'},
  'exam-cuet': {category: 'entrance', summary: 'UG entrance practice and revision'},
  'exam-state': {category: 'government', summary: 'State PSC and recruitment exams'},
  'exam-teaching': {category: 'teaching', summary: 'Eligibility and recruitment exams'},
  'exam-other': {category: 'entrance', summary: 'More entrance and recruitment exams'},
};

function getCategory(exam: Exam): Exclude<ExamCategory, 'all'> {
  const known = examDetails[exam.id]?.category;
  if (known) return known;
  const text = `${exam.title} ${exam.relatedExams?.join(' ') ?? ''}`.toLowerCase();
  if (/bank|ibps|sbi|rbi/.test(text)) return 'banking';
  if (/rail|rrb/.test(text)) return 'railway';
  if (/teach|tet|ctet/.test(text)) return 'teaching';
  if (/entrance|cuet|neet|jee/.test(text)) return 'entrance';
  return 'government';
}

function compareExams(sort: ExamSort) {
  return (a: Exam, b: Exam) => {
    if (sort === 'alphabetical') return a.title.localeCompare(b.title);
    if (sort === 'tests') {
      return (b.testCount ?? 0) - (a.testCount ?? 0) || a.title.localeCompare(b.title);
    }
    return (
      (b.learnerCount ?? 0) - (a.learnerCount ?? 0) ||
      (b.testCount ?? 0) - (a.testCount ?? 0) ||
      Number(b.pricing === 'free') - Number(a.pricing === 'free') ||
      a.title.localeCompare(b.title)
    );
  };
}

function compactNumber(value: number) {
  if (value < 1000) return String(value);
  const compact = value >= 10000 ? Math.round(value / 1000) : Math.round(value / 100) / 10;
  return `${compact}k`;
}

function durationLabel(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function ListGap() {
  return <View style={styles.listGap} />;
}

function DailySprint({
  test,
  compact,
  onStart,
  onAllTests,
}: {
  test?: TestDefinition;
  compact: boolean;
  onStart: () => void;
  onAllTests: () => void;
}) {
  return (
    <Gradient
      colors={['#071C42', '#123F7D', '#1976D2']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[styles.sprint, compact && styles.sprintCompact]}>
      <View style={styles.sprintGlowTop} />
      <View style={styles.sprintGlowBottom} />
      <View style={styles.sprintCopy}>
        <View style={styles.sprintEyebrow}>
          <View style={styles.liveDot} />
          <AppText weight="800" size={9.5} color="#A9D7FF" style={styles.eyebrowText}>
            DAILY SPRINT
          </AppText>
        </View>
        <AppText weight="900" size={22} color="#FFFFFF" style={styles.sprintTitle}>
          10 minutes. One step closer.
        </AppText>
        <AppText size={11.5} color="rgba(255,255,255,0.76)" style={styles.sprintSubtitle} numberOfLines={2}>
          {test?.title ?? 'Warm up with a focused practice set and sharpen your speed.'}
        </AppText>
        <View style={styles.sprintMeta}>
          <View style={styles.metaPill}>
            <Icon name="clipboard" size={12} color="#D8EBFF" />
            <AppText weight="700" size={10} color="#FFFFFF">
              {test ? `${test.questionCount} questions` : 'Practice set'}
            </AppText>
          </View>
          {test ? (
            <View style={styles.metaPill}>
              <Icon name="clock" size={12} color="#D8EBFF" />
              <AppText weight="700" size={10} color="#FFFFFF">
                {durationLabel(test.durationSeconds)}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.sprintActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={test ? `Start ${test.title}` : 'Browse mock tests'}
            onPress={onStart}
            style={({pressed}) => [styles.startButton, pressed && styles.pressed]}>
            <View style={styles.startIcon}>
              <Icon name="play" size={10} color="#0D47A1" filled />
            </View>
            <AppText weight="900" size={11.5} color="#0D47A1">
              {test ? 'Start now' : 'Browse tests'}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onAllTests}
            style={({pressed}) => [styles.allTestsButton, pressed && styles.pressed]}>
            <AppText weight="800" size={11} color="#FFFFFF">All mock tests</AppText>
            <Icon name="chev" size={12} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      {!compact ? (
        <View style={styles.sprintArt} pointerEvents="none">
          <View style={styles.orbitLarge}>
            <View style={styles.orbitSmall}>
              <Icon name="target" size={46} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.boostBadge}>
            <Icon name="zap" size={11} color="#E65100" filled />
            <AppText weight="900" size={8.5} color="#7A3300">DAILY BOOST</AppText>
          </View>
        </View>
      ) : null}
    </Gradient>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  tone,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  tone: ClayVariant;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({pressed}) => [
        styles.quickAction,
        {backgroundColor: theme.colors.white, borderColor: theme.colors.progressTrack},
        pressed && styles.pressed,
      ]}>
      <View style={[styles.quickIcon, {backgroundColor: clay[tone].bg}]}>
        <Icon name={icon} size={17} color={clay[tone].icon} />
      </View>
      <View style={styles.quickCopy}>
        <AppText weight="800" size={11.5} color={theme.colors.navy} numberOfLines={1}>
          {title}
        </AppText>
        <AppText size={9.5} color={theme.colors.text2} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Icon name="chev" size={13} color={theme.colors.text3} />
    </Pressable>
  );
}

function SegmentedPricing({
  value,
  onChange,
}: {
  value: PricingFilter;
  onChange: (value: PricingFilter) => void;
}) {
  const theme = useTheme();
  const options: {key: PricingFilter; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'free', label: 'Free'},
    {key: 'paid', label: 'Premium'},
  ];
  return (
    <View style={[styles.segmented, {backgroundColor: theme.colors.pressed}]}>
      {options.map(option => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{selected}}
            onPress={() => onChange(option.key)}
            style={({pressed}) => [
              styles.segment,
              selected && [styles.segmentSelected, {backgroundColor: theme.colors.white}],
              pressed && styles.pressed,
            ]}>
            <AppText
              weight={selected ? '900' : '700'}
              size={11}
              color={selected ? theme.colors.primary : theme.colors.text2}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ExamCard({exam, onPress}: {exam: Exam; onPress: () => void}) {
  const theme = useTheme();
  const summary =
    exam.description ||
    examDetails[exam.id]?.summary ||
    exam.subtitle ||
    'Syllabus, guided practice and mock tests';
  const related = exam.relatedExams?.slice(0, 2) ?? [];
  const accent = exam.iconColor ?? clay[exam.clay].icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${exam.title}`}
      onPress={onPress}
      style={({pressed}) => [
        styles.examCard,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.progressTrack,
          shadowColor: theme.scheme === 'dark' ? '#000000' : '#173A6A',
        },
        pressed && styles.cardPressed,
      ]}>
      <View style={[styles.examAccent, {backgroundColor: accent}]} />
      <View style={[styles.examIcon, {backgroundColor: clay[exam.clay].bg}]}>
        <Icon name={exam.icon as IconName} size={25} color={accent} />
      </View>
      <View style={styles.examBody}>
        <View style={styles.examTitleRow}>
          <AppText weight="900" size={15} color={theme.colors.navy} numberOfLines={1} style={styles.examTitle}>
            {exam.title}
          </AppText>
          <AccessBadge pricing={exam.pricing} />
        </View>
        <AppText size={10.5} color={theme.colors.text2} numberOfLines={2} style={styles.examSummary}>
          {summary}
        </AppText>
        {related.length ? (
          <View style={styles.relatedRow}>
            {related.map(item => (
              <View key={item} style={[styles.relatedChip, {backgroundColor: theme.colors.pressed}]}>
                <AppText weight="700" size={8.5} color={theme.colors.text2} numberOfLines={1}>
                  {item}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.examFooter}>
          <View style={styles.examMetrics}>
            <View style={styles.metric}>
              <Icon name="clipboard" size={12} color={theme.colors.primary} />
              <AppText weight="700" size={9.5} color={theme.colors.text2}>
                {exam.testCount ? `${exam.testCount} tests` : 'Practice sets'}
              </AppText>
            </View>
            {exam.learnerCount ? (
              <View style={styles.metric}>
                <Icon name="users" size={12} color={theme.colors.success} />
                <AppText weight="700" size={9.5} color={theme.colors.text2}>
                  {compactNumber(exam.learnerCount)} learners
                </AppText>
              </View>
            ) : null}
          </View>
          <View style={[styles.openButton, {backgroundColor: theme.colors.primary}]}>
            <Icon name="chev" size={14} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function CompetitiveExamsScreen() {
  const navigation = useNavigation<HomeNav>();
  const route = useRoute();
  const repos = useRepositories();
  const theme = useTheme();
  const {width, fontScale} = useWindowDimensions();
  const initialPricing =
    ((route.params as {pricing?: PricingFilter} | undefined)?.pricing ?? 'all') as PricingFilter;
  const [pricing, setPricing] = useState<PricingFilter>(initialPricing);
  const [category, setCategory] = useState<ExamCategory>('all');
  const [sort, setSort] = useState<ExamSort>('recommended');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const compactHero = width < 370 || fontScale > 1.15;

  const examsQuery = useInfiniteQuery({
    queryKey: queryKeys.catalog('exam', {search: deferredSearch, pricing}),
    initialPageParam: undefined as string | undefined,
    queryFn: ({pageParam}) =>
      repos.catalog.list({kind: 'exam', search: deferredSearch, pricing, cursor: pageParam}),
    getNextPageParam: page => page.nextCursor ?? undefined,
  });
  const testsQuery = useQuery({
    queryKey: queryKeys.tests({scope: 'competitive-exams'}),
    queryFn: () => repos.assessments.tests(),
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: examsQuery.isRefetching || testsQuery.isRefetching,
    onRefresh: () => {
      Promise.all([examsQuery.refetch(), testsQuery.refetch()]).catch(
        () => undefined,
      );
    },
  });
  const dailyTest =
    testsQuery.data?.find(test => test.pricing === 'free' && /daily/i.test(test.title)) ??
    testsQuery.data?.find(test => test.pricing === 'free' && test.mode === 'practice');
  const allExams = (examsQuery.data?.pages.flatMap(page => page.items) ?? []).filter(
    (item): item is Exam => item.kind === 'exam',
  );
  const visibleExams = useMemo(
    () =>
      allExams
        .filter(exam => category === 'all' || getCategory(exam) === category)
        .sort(compareExams(sort)),
    [allExams, category, sort],
  );
  const total = examsQuery.data?.pages[0]?.total ?? allExams.length;

  const openAllTests = () => navigation.navigate('TestList');
  const openDailyTest = () => {
    if (dailyTest) navigation.navigate('TestInstructions', {testId: dailyTest.id});
    else openAllTests();
  };
  const showFreePrep = () => {
    setSearch('');
    setCategory('all');
    setPricing('free');
  };
  const showTopPicks = () => {
    setSearch('');
    setCategory('all');
    setPricing('all');
    setSort('recommended');
  };
  const resetFilters = () => {
    setSearch('');
    setPricing('all');
    setCategory('all');
    setSort('recommended');
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <BrandedHeader
        showBack={navigation.canGoBack()}
        onBack={() => navigation.goBack()}
        onNotifications={showLearnerUnavailable}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        data={visibleExams}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.page}
        ItemSeparatorComponent={ListGap}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (examsQuery.hasNextPage && !examsQuery.isFetchingNextPage) {
            examsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          examsQuery.isFetchingNextPage ? <LoadingBlock /> : <View style={styles.footerSpace} />
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <AppText weight="800" size={9.5} color={theme.colors.primary} style={styles.pageEyebrow}>
                  COMPETITIVE EXAMS
                </AppText>
                <AppText weight="900" size={25} color={theme.colors.navy} style={styles.pageTitle}>
                  Prepare with a plan
                </AppText>
                <AppText size={11.5} color={theme.colors.text2} style={styles.titleSubtitle}>
                  Choose a target, practise daily, and measure your progress.
                </AppText>
              </View>
              <View style={[styles.trackCount, {backgroundColor: theme.colors.white, borderColor: theme.colors.progressTrack}]}>
                <AppText weight="900" size={18} color={theme.colors.primary}>{total}</AppText>
                <AppText weight="800" size={7.5} color={theme.colors.text3} style={styles.trackCountLabel}>
                  TRACKS
                </AppText>
              </View>
            </View>

            <DailySprint
              test={dailyTest}
              compact={compactHero}
              onStart={openDailyTest}
              onAllTests={openAllTests}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRail}>
              <QuickAction
                icon="clipboard"
                title="Mock tests"
                subtitle="Train with a timer"
                tone="blue"
                onPress={openAllTests}
              />
              <QuickAction
                icon="gift"
                title="Free prep"
                subtitle="Start at no cost"
                tone="green"
                onPress={showFreePrep}
              />
              <QuickAction
                icon="trendup"
                title="Top picks"
                subtitle="Popular with learners"
                tone="orange"
                onPress={showTopPicks}
              />
            </ScrollView>

            <SearchInput
              placeholder="Search SSC, Banking, Railway, UPSC..."
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
            />

            <View style={styles.goalSection}>
              <View style={styles.sectionTitleRow}>
                <View>
                  <AppText weight="900" size={16} color={theme.colors.navy}>Choose your goal</AppText>
                  <AppText size={10.5} color={theme.colors.text2} style={styles.sectionHint}>
                    Narrow the list by exam family
                  </AppText>
                </View>
                {category !== 'all' ? (
                  <Pressable onPress={() => setCategory('all')} hitSlop={8}>
                    <AppText weight="800" size={10.5} color={theme.colors.primary}>Clear</AppText>
                  </Pressable>
                ) : null}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRail}>
                {categories.map(item => {
                  const selected = item.key === category;
                  return (
                    <Pressable
                      key={item.key}
                      accessibilityRole="button"
                      accessibilityState={{selected}}
                      onPress={() => setCategory(item.key)}
                      style={({pressed}) => [
                        styles.categoryChip,
                        {
                          backgroundColor: selected ? theme.colors.primary : theme.colors.white,
                          borderColor: selected ? theme.colors.primary : theme.colors.progressTrack,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <View style={[styles.categoryIcon, selected && styles.categoryIconSelected]}>
                        <Icon
                          name={item.icon}
                          size={14}
                          color={selected ? '#FFFFFF' : theme.colors.primary}
                        />
                      </View>
                      <AppText
                        weight="800"
                        size={10.5}
                        color={selected ? '#FFFFFF' : theme.colors.navy}>
                        {item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.exploreHeader}>
              <View style={styles.sectionTitleRow}>
                <View>
                  <AppText weight="900" size={17} color={theme.colors.navy}>Exam tracks</AppText>
                  <AppText size={10.5} color={theme.colors.text2} style={styles.sectionHint}>
                    {category === 'all' && !search
                      ? `${total} preparation paths available`
                      : `${visibleExams.length} matching ${visibleExams.length === 1 ? 'track' : 'tracks'}`}
                  </AppText>
                </View>
                <SegmentedPricing value={pricing} onChange={setPricing} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortRail}>
                {sortOptions.map(option => {
                  const selected = sort === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      accessibilityRole="button"
                      accessibilityState={{selected}}
                      onPress={() => setSort(option.key)}
                      style={({pressed}) => [
                        styles.sortChip,
                        {
                          backgroundColor: selected ? theme.colors.pressed : 'transparent',
                          borderColor: selected ? theme.colors.primary : theme.colors.progressTrack,
                        },
                        pressed && styles.pressed,
                      ]}>
                      {selected ? <Icon name="check" size={11} color={theme.colors.primary} /> : null}
                      <AppText
                        weight={selected ? '800' : '700'}
                        size={10}
                        color={selected ? theme.colors.primary : theme.colors.text2}>
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {examsQuery.isError ? (
              <ErrorState
                message="We could not load the exam catalogue."
                onRetry={() => examsQuery.refetch()}
              />
            ) : null}
            {examsQuery.isLoading ? <LoadingBlock /> : null}
          </View>
        }
        renderItem={({item}) => (
          <ExamCard
            exam={item}
            onPress={() => navigation.navigate('ExamDetail', {examId: item.id})}
          />
        )}
        ListEmptyComponent={
          !examsQuery.isLoading && !examsQuery.isError ? (
            <EmptyState
              title="No matching exam tracks"
              body="Try another keyword or reset the selected goal and access filters."
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
    paddingTop: 18,
  },
  headerContent: {gap: 18, marginBottom: 14},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  titleCopy: {flex: 1, minWidth: 0},
  pageEyebrow: {letterSpacing: 1.35},
  pageTitle: {marginTop: 5, lineHeight: 31},
  titleSubtitle: {marginTop: 5, lineHeight: 17, maxWidth: 310},
  trackCount: {
    width: 61,
    height: 61,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 18px -14px rgba(13,71,161,0.65)',
  },
  trackCountLabel: {letterSpacing: 1.1, marginTop: 1},
  sprint: {
    minHeight: 224,
    borderRadius: 26,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    boxShadow: '0 18px 30px -20px rgba(13,71,161,0.85)',
  },
  sprintCompact: {minHeight: 238},
  sprintGlowTop: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(93,177,255,0.13)',
    right: -72,
    top: -105,
  },
  sprintGlowBottom: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    left: -67,
    bottom: -88,
  },
  sprintCopy: {flex: 1, padding: 18, justifyContent: 'center', zIndex: 2},
  sprintEyebrow: {flexDirection: 'row', alignItems: 'center', gap: 7},
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#63E6BE',
    boxShadow: '0 0 9px rgba(99,230,190,0.9)',
  },
  eyebrowText: {letterSpacing: 1.2},
  sprintTitle: {lineHeight: 28, marginTop: 9, maxWidth: 250},
  sprintSubtitle: {lineHeight: 17, marginTop: 7, maxWidth: 270},
  sprintMeta: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12},
  metaPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  sprintActions: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 14},
  startButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  startIcon: {
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
  },
  allTestsButton: {minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3},
  sprintArt: {width: '31%', minWidth: 103, alignItems: 'center', justifyContent: 'center', zIndex: 1},
  orbitLarge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orbitSmall: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: -8,
    backgroundColor: '#FFF2D7',
  },
  quickRail: {gap: 9, paddingRight: 4},
  quickAction: {
    width: 176,
    minHeight: 66,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  quickIcon: {width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  quickCopy: {flex: 1, minWidth: 0, gap: 3},
  goalSection: {gap: 10},
  sectionTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  sectionHint: {marginTop: 4},
  categoryRail: {gap: 8, paddingRight: 4},
  categoryChip: {
    minHeight: 45,
    borderRadius: 15,
    paddingLeft: 7,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pastel.blue,
  },
  categoryIconSelected: {backgroundColor: 'rgba(255,255,255,0.14)'},
  exploreHeader: {gap: 11, marginTop: 1},
  segmented: {flexDirection: 'row', borderRadius: 12, padding: 3},
  segment: {minHeight: 32, borderRadius: 9, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center'},
  segmentSelected: {boxShadow: '0 3px 10px -7px rgba(13,71,161,0.8)'},
  sortRail: {gap: 7, paddingRight: 4},
  sortChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  examCard: {
    minHeight: 142,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    overflow: 'hidden',
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.1,
    shadowRadius: 13,
    elevation: 2,
  },
  cardPressed: {opacity: 0.9, transform: [{scale: 0.995}]},
  examAccent: {position: 'absolute', top: 19, left: 0, width: 4, height: 42, borderTopRightRadius: 4, borderBottomRightRadius: 4},
  examIcon: {width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  examBody: {flex: 1, minWidth: 0},
  examTitleRow: {minHeight: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  examTitle: {flex: 1, minWidth: 0, lineHeight: 20},
  examSummary: {lineHeight: 15, marginTop: 3},
  relatedRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8},
  relatedChip: {borderRadius: 999, paddingVertical: 4, paddingHorizontal: 7, maxWidth: 112},
  examFooter: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 10},
  examMetrics: {flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10},
  metric: {flexDirection: 'row', alignItems: 'center', gap: 4},
  openButton: {width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  listGap: {height: 11},
  footerSpace: {height: 30},
  pressed: {opacity: 0.76},
});
