import {createThemedStyles} from '../../theme';
import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useQueries, useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey, useSessionStore} from '../../core/session';
import {AppText, EmptyState, ErrorState, LoadingBlock, ProgressBar, SearchInput} from '../../components/ui';
import {ClayButton, ClayCard, IconButton} from '../../components/ui/Clay';
import {Gradient} from '../../components/ui/Gradient';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Icon} from '../../assets/icons';
import {clay, colors, gradients, radius, space} from '../../theme';
import type {Course, Enrollment} from '../../core/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {LearningStackParamList} from '../../navigation/types';
import {virtualizedListPerformanceProps} from '../../components/layout/listPerformance';

type CourseFilter = 'all' | 'active' | 'completed';
type CourseRow = {enrollment: Enrollment; course?: Course};

const filters: {value: CourseFilter; label: string}[] = [
  {value: 'all', label: 'All'},
  {value: 'active', label: 'In progress'},
  {value: 'completed', label: 'Completed'},
];

export function EnrolledCoursesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LearningStackParamList>>();
  const repos = useRepositories();
  const status = useSessionStore(state => state.status);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CourseFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const userKey = accountKey();

  const enrollments = useQuery({
    queryKey: queryKeys.enrollments(userKey),
    queryFn: () => repos.learning.enrollments(),
    enabled: status === 'authenticated',
  });
  const courseQueries = useQueries({
    queries: (enrollments.data ?? []).map(item => ({
      queryKey: queryKeys.course(item.courseId),
      queryFn: () => repos.catalog.course(item.courseId),
      enabled: status === 'authenticated',
    })),
  });

  const rows = useMemo<CourseRow[]>(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return (enrollments.data ?? [])
      .map((enrollment, index) => ({enrollment, course: courseQueries[index]?.data}))
      .filter(({enrollment, course}) => {
        const complete = enrollment.progress.percent >= 100;
        if (filter === 'active' && complete) return false;
        if (filter === 'completed' && !complete) return false;
        if (!normalizedSearch) return true;
        return [course?.title, course?.instructor?.name, enrollment.courseId]
          .filter(Boolean)
          .some(value => value!.toLocaleLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => Date.parse(b.enrollment.progress.updatedAt) - Date.parse(a.enrollment.progress.updatedAt));
  }, [courseQueries, enrollments.data, filter, search]);

  const summary = useMemo(() => {
    const items = enrollments.data ?? [];
    const completed = items.filter(item => item.progress.percent >= 100).length;
    const completedLessons = items.reduce((total, item) => total + item.progress.completedLessons, 0);
    const totalLessons = items.reduce((total, item) => total + item.progress.totalLessons, 0);
    const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {active: items.length - completed, completed, completedLessons, totalLessons, percent};
  }, [enrollments.data]);

  const openCourse = ({enrollment}: CourseRow) => {
    if (enrollment.kind === 'semester') {
      showLearnerUnavailable();
      return;
    }
    if (enrollment.progress.percent < 100 && enrollment.progress.nextLessonId) {
      navigation.navigate('LessonPlayer', {
        courseId: enrollment.courseId,
        lessonId: enrollment.progress.nextLessonId,
        enrollmentId: enrollment.id,
      });
      return;
    }
    navigation.navigate('CourseDetail', {courseId: enrollment.courseId});
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await enrollments.refetch();
      await Promise.all(courseQueries.map(query => query.refetch()));
    } finally {
      setRefreshing(false);
    }
  };
  const pullRefresh = usePullRefreshFeedback({
    refreshing,
    onRefresh: refresh,
    enabled: status === 'authenticated',
  });

  const resetFilters = () => {
    setSearch('');
    setFilter('all');
  };

  if (status !== 'authenticated') {
    return (
      <Screen padded={false}>
        <DetailHeader title="My Courses" subtitle="Your learning journey" onBack={() => navigation.goBack()} />
        <View style={styles.centerPage}>
          <ClayCard variant="sky" style={styles.guestCard}>
            <View style={styles.guestIcon}><Icon name="bookopen" size={28} color={colors.primary} /></View>
            <AppText weight="900" size={19} color={colors.navy} center>Keep your learning in sync</AppText>
            <AppText size={12.5} color={colors.text2} center style={styles.guestCopy}>
              Sign in to see enrolled courses, resume lessons, and track your progress.
            </AppText>
            <ClayButton label="Sign in to continue" onPress={() => useSessionStore.getState().showLogin()} />
          </ClayCard>
        </View>
      </Screen>
    );
  }

  const hasFilters = Boolean(search.trim()) || filter !== 'all';

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="My Courses"
        subtitle="Learn at your own pace"
        onBack={() => navigation.goBack()}
        right={<IconButton icon="download" onPress={() => navigation.navigate('Downloads')} accessibilityLabel="Downloads" />}
        onNotifications={showLearnerUnavailable}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        data={rows}
        keyExtractor={item => item.enrollment.id}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <ProgressOverview {...summary} />
            <SearchInput
              placeholder="Search your courses"
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
            />
            <View style={styles.filterRow}>
              {filters.map(item => (
                <FilterChip
                  key={item.value}
                  label={item.label}
                  selected={filter === item.value}
                  onPress={() => setFilter(item.value)}
                />
              ))}
            </View>
            <View style={styles.resultsHeading}>
              <AppText weight="900" size={16.5} color={colors.navy}>
                {filter === 'completed' ? 'Completed courses' : filter === 'active' ? 'Continue learning' : 'Your courses'}
              </AppText>
              {!enrollments.isLoading && !enrollments.isError ? (
                <AppText weight="700" size={11} color={colors.text2}>{rows.length} {rows.length === 1 ? 'course' : 'courses'}</AppText>
              ) : null}
            </View>
            {enrollments.isLoading ? <LoadingBlock /> : null}
            {enrollments.isError ? <ErrorState message="Your courses could not be loaded." onRetry={() => { enrollments.refetch(); }} /> : null}
          </View>
        }
        renderItem={({item}) => <EnrolledCourseCard row={item} onPress={() => openCourse(item)} />}
        ItemSeparatorComponent={CourseSeparator}
        ListEmptyComponent={!enrollments.isLoading && !enrollments.isError ? (
          <EmptyState
            title={hasFilters ? 'No courses found' : 'No courses yet'}
            body={hasFilters ? 'Try another search or clear your filters.' : 'Your enrolled courses will appear here.'}
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? resetFilters : undefined}
          />
        ) : undefined}
      />
    </Screen>
  );
}

function ProgressOverview({
  active,
  completed,
  completedLessons,
  totalLessons,
  percent,
}: {
  active: number;
  completed: number;
  completedLessons: number;
  totalLessons: number;
  percent: number;
}) {
  return (
    <Gradient colors={gradients.banner} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.overview}>
      <View style={styles.overviewGlow} />
      <View style={styles.overviewTop}>
        <View style={styles.overviewCopy}>
          <AppText weight="900" size={18} color="#fff">Your learning progress</AppText>
          <AppText size={10.5} color="rgba(255,255,255,0.78)" style={styles.overviewSubtitle}>
            {totalLessons ? `${completedLessons} of ${totalLessons} lessons completed` : 'Your progress will build here'}
          </AppText>
        </View>
        <View style={styles.percentRing}>
          <AppText weight="900" size={17} color="#fff">{percent}%</AppText>
        </View>
      </View>
      <View style={styles.overviewProgressTrack}>
        <View style={[styles.overviewProgressFill, {width: `${Math.max(0, Math.min(100, percent))}%`}]} />
      </View>
      <View style={styles.statRow}>
        <SummaryStat icon="play" value={active} label="In progress" />
        <View style={styles.statDivider} />
        <SummaryStat icon="check" value={completed} label="Completed" />
        <View style={styles.statDivider} />
        <SummaryStat icon="bookopen" value={completedLessons} label="Lessons done" />
      </View>
    </Gradient>
  );
}

function CourseSeparator() {
  return <View style={styles.separator} />;
}

function SummaryStat({icon, value, label}: {icon: 'play' | 'check' | 'bookopen'; value: number; label: string}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}><Icon name={icon} size={11} color="#fff" /></View>
      <View>
        <AppText weight="900" size={14} color="#fff">{value}</AppText>
        <AppText weight="600" size={8.5} color="rgba(255,255,255,0.72)">{label}</AppText>
      </View>
    </View>
  );
}

function FilterChip({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}>
      {selected ? <Icon name="check" size={11} color="#fff" /> : null}
      <AppText weight="800" size={11.5} color={selected ? '#fff' : colors.text2}>{label}</AppText>
    </Pressable>
  );
}

function EnrolledCourseCard({row, onPress}: {row: CourseRow; onPress: () => void}) {
  const {enrollment, course} = row;
  const progress = Math.max(0, Math.min(100, enrollment.progress.percent));
  const complete = progress >= 100;
  const notStarted = progress <= 0;
  const title = course?.title ?? readableCourseId(enrollment.courseId);
  const tone = course?.clay ?? 'blue';
  const accent = complete ? colors.success : clay[tone].icon;
  const buttonLabel = enrollment.kind === 'semester'
    ? 'View semester'
    : complete
      ? 'Review course'
      : notStarted
        ? 'Start course'
        : 'Resume';

  return (
    <ClayCard variant="white" padded={false} style={styles.courseCard} onPress={onPress}>
      <View style={styles.courseMain}>
        <View style={[styles.courseArtwork, {backgroundColor: clay[tone].bg}]}>
          <View style={styles.artworkShine} />
          {course?.letter ? (
            <AppText weight="900" size={course.letter.length > 2 ? 17 : 24} color={accent}>{course.letter}</AppText>
          ) : (
            <Icon name="bookopen" size={27} color={accent} />
          )}
        </View>
        <View style={styles.courseCopy}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, {backgroundColor: complete ? colors.pastel.green : colors.pastel.blue}]}>
              <View style={[styles.statusDot, {backgroundColor: complete ? colors.success : colors.primary}]} />
              <AppText weight="800" size={8.5} color={complete ? colors.success : colors.deepBlue}>
                {complete ? 'COMPLETED' : notStarted ? 'READY TO START' : 'IN PROGRESS'}
              </AppText>
            </View>
            {enrollment.kind === 'semester' ? (
              <View style={styles.semesterBadge}><AppText weight="800" size={8.5} color="#5E35B1">SEMESTER</AppText></View>
            ) : null}
          </View>
          <AppText weight="900" size={14} color={colors.navy} numberOfLines={2}>{title}</AppText>
          <View style={styles.metaRow}>
            {course?.instructor?.name ? (
              <>
                <Icon name="teacher" size={11} color={colors.text3} />
                <AppText size={9.5} color={colors.text2} numberOfLines={1} style={styles.metaText}>{course.instructor.name}</AppText>
                <View style={styles.metaDot} />
              </>
            ) : null}
            <Icon name="clock" size={11} color={colors.text3} />
            <AppText size={9.5} color={colors.text2}>{formatActivity(enrollment.progress.updatedAt)}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <AppText weight="700" size={10} color={colors.text2}>
            {enrollment.progress.completedLessons} of {enrollment.progress.totalLessons} lessons
          </AppText>
          <AppText weight="900" size={11} color={accent}>{progress}%</AppText>
        </View>
        <ProgressBar percent={progress} height={8} />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.nextUp}>
          <Icon name={complete ? 'award' : 'play'} size={13} color={accent} />
          <AppText weight="700" size={10} color={colors.text2} numberOfLines={1} style={styles.metaText}>
            {complete ? 'Course completed — revisit anytime' : notStarted ? 'Ready when you are' : `${Math.max(0, enrollment.progress.totalLessons - enrollment.progress.completedLessons)} lessons remaining`}
          </AppText>
        </View>
        <Gradient colors={complete ? gradients.freeBadge : gradients.primaryButton} style={styles.courseAction}>
          <AppText weight="900" size={10.5} color="#fff">{buttonLabel}</AppText>
          <Icon name={complete ? 'chev' : 'play'} size={10} color="#fff" filled={!complete} />
        </Gradient>
      </View>
    </ClayCard>
  );
}

function readableCourseId(courseId: string) {
  return courseId
    .replace(/^course-/, '')
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Your course';
}

function formatActivity(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Recently active';
  const elapsedDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (elapsedDays === 0) return 'Active today';
  if (elapsedDays === 1) return 'Active yesterday';
  if (elapsedDays < 7) return `Active ${elapsedDays} days ago`;
  return `Active ${new Date(timestamp).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}`;
}

const styles = createThemedStyles({
  page: {paddingHorizontal: space.pageX, paddingTop: 14, paddingBottom: 30},
  headerContent: {gap: 14, marginBottom: 12},
  centerPage: {flex: 1, justifyContent: 'center', padding: space.pageX},
  guestCard: {alignItems: 'center', padding: 22, gap: 12},
  guestIcon: {width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pastel.blue},
  guestCopy: {maxWidth: 290, lineHeight: 19},
  overview: {borderRadius: radius.hero, padding: 16, overflow: 'hidden', boxShadow: '0 16px 27px -15px rgba(13,71,161,0.72)'},
  overviewGlow: {position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -48, top: -68, backgroundColor: 'rgba(255,255,255,0.09)'},
  overviewTop: {flexDirection: 'row', alignItems: 'center', gap: 14},
  overviewCopy: {flex: 1, minWidth: 0},
  overviewSubtitle: {marginTop: 5},
  percentRing: {width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 4, borderColor: 'rgba(255,255,255,0.74)'},
  overviewProgressTrack: {height: 6, borderRadius: 99, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 14},
  overviewProgressFill: {height: '100%', borderRadius: 99, backgroundColor: '#90CAF9'},
  statRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  stat: {flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7},
  statIcon: {width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)'},
  statDivider: {width: StyleSheet.hairlineWidth, height: 28, backgroundColor: 'rgba(255,255,255,0.2)'},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  filterChip: {minHeight: 38, borderRadius: 999, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: colors.subtle},
  filterChipSelected: {backgroundColor: colors.primary, boxShadow: '0 7px 13px -7px rgba(25,118,210,0.85)'},
  pressed: {opacity: 0.8},
  resultsHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2},
  separator: {height: 12},
  courseCard: {padding: 13, borderRadius: 20},
  courseMain: {flexDirection: 'row', alignItems: 'center', gap: 12},
  courseArtwork: {width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  artworkShine: {position: 'absolute', width: 55, height: 55, borderRadius: 28, top: -25, right: -20, backgroundColor: 'rgba(255,255,255,0.65)'},
  courseCopy: {flex: 1, minWidth: 0, gap: 6},
  badgeRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6},
  statusBadge: {alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5},
  statusDot: {width: 5, height: 5, borderRadius: 3},
  semesterBadge: {alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: colors.pastel.lavender},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaText: {flexShrink: 1},
  metaDot: {width: 3, height: 3, borderRadius: 2, backgroundColor: '#B0BEC5'},
  progressBlock: {gap: 7, marginTop: 13},
  progressLabels: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  cardFooter: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13},
  nextUp: {flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6},
  courseAction: {minHeight: 36, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
});
