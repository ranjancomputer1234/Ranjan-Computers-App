import {createThemedStyles} from '../../theme';
import React,
  {useMemo,
  useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useMutation, useQueries, useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryClient, queryKeys} from '../../core/query';
import {accountKey, useSessionStore} from '../../core/session';
import {clayShadow, colors, gradients, radius, space} from '../../theme';
import {AppText, ClayButton, EmptyState, ErrorState, LoadingBlock, ProgressBar} from '../../components/ui';
import {ClayCard, IconButton} from '../../components/ui/Clay';
import {Gradient} from '../../components/ui/Gradient';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Icon, type IconName} from '../../assets/icons';
import type {Bookmark, Enrollment} from '../../core/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {LearningStackParamList} from '../../navigation/types';

type LearningFilter = 'All' | 'Courses' | 'Tests' | 'News' | 'Facts';

const filters: {label: LearningFilter; icon?: IconName; tone?: 'green' | 'orange'}[] = [
  {label: 'All'},
  {label: 'Courses', icon: 'bookopen', tone: 'green'},
  {label: 'Tests', icon: 'clipboard', tone: 'green'},
  {label: 'News', icon: 'news', tone: 'orange'},
  {label: 'Facts', icon: 'bulb', tone: 'orange'},
];

const bookmarkPresentation: Record<Bookmark['ref']['kind'], {icon: IconName; color: string; background: readonly [string, string]}> = {
  course: {icon: 'bookopen', color: '#1976D2', background: ['#0D47A1', '#1976D2']},
  exam: {icon: 'target', color: '#E53935', background: ['#B71C1C', '#E53935']},
  fact: {icon: 'flask', color: '#8E24AA', background: ['#4527A0', '#8E24AA']},
  interviewQuestion: {icon: 'help', color: '#F57C00', background: ['#E65100', '#FB8C00']},
  interviewCategory: {icon: 'users', color: '#00897B', background: ['#00695C', '#26A69A']},
  lesson: {icon: 'play', color: '#1976D2', background: ['#0D47A1', '#1976D2']},
  liveClass: {icon: 'live', color: '#E53935', background: ['#B71C1C', '#EF5350']},
  news: {icon: 'news', color: '#1976D2', background: ['#0D47A1', '#1976D2']},
  document: {icon: 'doc', color: '#5E35B1', background: ['#4527A0', '#7E57C2']},
  section: {icon: 'book', color: '#1976D2', background: ['#0D47A1', '#42A5F5']},
  test: {icon: 'clipboard', color: '#2E7D32', background: ['#1B5E20', '#43A047']},
  topic: {icon: 'bulb', color: '#F57C00', background: ['#E65100', '#FB8C00']},
};

export function MyLearningScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LearningStackParamList>>();
  const repos = useRepositories();
  const status = useSessionStore(s => s.status);
  const profile = useSessionStore(s => s.profile);
  const [filter, setFilter] = useState<LearningFilter>('All');
  const [refreshing, setRefreshing] = useState(false);
  const userKey = accountKey();

  const enrollments = useQuery({
    queryKey: queryKeys.enrollments(userKey),
    queryFn: () => repos.learning.enrollments(),
    enabled: status === 'authenticated',
  });
  const bookmarks = useQuery({
    queryKey: queryKeys.bookmarks(userKey),
    queryFn: () => repos.learning.bookmarks(),
    enabled: status === 'authenticated',
  });
  const home = useQuery({
    queryKey: queryKeys.home(userKey),
    queryFn: () => repos.catalog.home(),
    enabled: status === 'authenticated',
  });
  const courseQueries = useQueries({
    queries: (enrollments.data ?? []).map(item => ({
      queryKey: queryKeys.course(item.courseId),
      queryFn: () => repos.catalog.course(item.courseId),
      enabled: status === 'authenticated',
    })),
  });

  const removeBookmark = useMutation({
    mutationFn: (item: Bookmark) => repos.learning.setBookmark(item.ref, false),
    onSuccess: async () => queryClient.invalidateQueries({queryKey: queryKeys.bookmarks(userKey)}),
    onError: () => Alert.alert('Could not remove item', 'Please try again.'),
  });

  const savedItems = useMemo(() => {
    const items = bookmarks.data ?? [];
    if (filter === 'News') return items.filter(item => item.ref.kind === 'news');
    if (filter === 'Facts') return items.filter(item => item.ref.kind === 'fact');
    if (filter === 'Courses') return items.filter(item => item.ref.kind === 'course');
    if (filter === 'Tests') return items.filter(item => item.ref.kind === 'test');
    return items;
  }, [bookmarks.data, filter]);

  const inProgress = (enrollments.data ?? []).filter(item => item.progress.percent < 100);
  const continuing = home.data?.continueLearning ?? [];
  const resume = continuing[0];

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([enrollments.refetch(), bookmarks.refetch(), home.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };
  const pullRefresh = usePullRefreshFeedback({
    refreshing,
    onRefresh: refresh,
    enabled: status === 'authenticated',
  });

  const openEnrollment = (item: Enrollment) => {
    if (item.kind === 'semester') {
      showLearnerUnavailable();
    } else if (item.progress.nextLessonId) {
      navigation.navigate('LessonPlayer', {
        courseId: item.courseId,
        lessonId: item.progress.nextLessonId,
        enrollmentId: item.id,
      });
    } else {
      navigation.navigate('CourseDetail', {courseId: item.courseId});
    }
  };

  const openBookmark = (item: Bookmark) => {
    if (item.ref.kind === 'course') navigation.navigate('CourseDetail', {courseId: item.ref.id});
    else if (item.ref.kind === 'lesson') navigation.navigate('LessonPlayer', {lessonId: item.ref.id});
    else showLearnerUnavailable();
  };

  const confirmRemove = (item: Bookmark) => {
    Alert.alert('Remove saved item?', item.title, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => removeBookmark.mutate(item)},
    ]);
  };

  if (status !== 'authenticated') {
    return (
      <Screen padded={false}>
        <DetailHeader
          title="My Learning"
          subtitle="Continue where you left off"
          right={<IconButton icon="download" onPress={() => navigation.navigate('Downloads')} accessibilityLabel="Downloads" />}
          onNotifications={showLearnerUnavailable}
        />
        <View style={styles.guestPage}>
          <ClayCard variant="sky" style={styles.guestCard}>
            <View style={styles.guestIcon}><Icon name="bookmark" size={26} color={colors.primary} /></View>
            <AppText weight="900" size={19} color={colors.navy} center>Your learning, all in one place</AppText>
            <AppText size={12.5} color={colors.text2} center style={styles.guestCopy}>
              Sign in to resume courses, review results, and keep saved stories synced.
            </AppText>
            <ClayButton label="Sign in to continue" onPress={() => useSessionStore.getState().showLogin()} />
          </ClayCard>
        </View>
      </Screen>
    );
  }

  const showCourses = filter === 'All' || filter === 'Courses';
  const showResults = filter === 'Tests';
  const savedTitle = filter === 'All' ? 'Saved Stories' : `Saved ${filter}`;

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="My Learning"
        subtitle="Continue where you left off"
        right={<IconButton icon="download" onPress={() => navigation.navigate('Downloads')} accessibilityLabel="Downloads" />}
        onNotifications={showLearnerUnavailable}
        unread={(home.data?.unreadNotifications ?? 0) > 0}
      />
      <ScrollView
        {...pullRefresh.scrollProps}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}>
        <Gradient colors={['#1B5E20', '#2E7D32', '#43A047']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.streakRow}>
              <View style={styles.streakDot} />
              <Gradient colors={['#FDD835', '#F9A825']} style={styles.streakPill}>
                <AppText weight="900" size={9} color="#4E342E" style={styles.tracking}>
                  {profile?.stats.streakDays ?? 0}-DAY STREAK
                </AppText>
              </Gradient>
            </View>
            <AppText weight="900" size={18} color="#fff" numberOfLines={1}>
              You're on fire, {profile?.fullName?.split(' ')[0] ?? 'Learner'}!
            </AppText>
            <View style={styles.summaryRow}>
              <Icon name="trendup" size={13} color="rgba(255,255,255,0.88)" />
              <AppText size={10.5} weight="600" color="rgba(255,255,255,0.88)">
                {inProgress.length} {inProgress.length === 1 ? 'course' : 'courses'} in progress · Keep it going
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!resume}
              onPress={() => resume && navigation.navigate('LessonPlayer', {courseId: resume.courseId, lessonId: resume.lessonId, enrollmentId: resume.enrollmentId})}
              style={({pressed}) => [styles.resumeButton, !resume && styles.disabled, pressed && styles.pressed]}>
              <AppText weight="900" size={11.5} color="#fff">{resume ? 'Resume Learning' : 'No active lesson'}</AppText>
              {resume ? <Icon name="play" size={11} color="#fff" filled /> : null}
            </Pressable>
          </View>
          <Icon name="zap" size={86} color="rgba(255,255,255,0.9)" style={styles.heroBolt} />
        </Gradient>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map(item => (
            <LearningChip key={item.label} {...item} selected={filter === item.label} onPress={() => setFilter(item.label)} />
          ))}
        </ScrollView>

        {showCourses ? (
          <View style={styles.section}>
            <SectionHeader title="Continue Learning" action="See all" onPress={() => navigation.navigate('EnrolledCourses')} />
            {continuing.map(item => (
              <Pressable
                key={item.lessonId}
                accessibilityRole="button"
                onPress={() => navigation.navigate('LessonPlayer', {courseId: item.courseId, lessonId: item.lessonId, enrollmentId: item.enrollmentId})}
                style={({pressed}) => [pressed && styles.pressed]}>
                <AppText weight="800" size={13} color={colors.navy}>{item.title}</AppText>
                <AppText size={11} color={colors.text2}>{item.lessonLabel} · {item.percent}%</AppText>
              </Pressable>
            ))}
            {enrollments.isLoading ? <LoadingBlock /> : null}
            {enrollments.isError ? <ErrorState message="Your courses could not be loaded." onRetry={() => { enrollments.refetch(); }} /> : null}
            {!enrollments.isLoading && !enrollments.isError && !inProgress.length ? (
              <EmptyState title="No active courses" body="Enrol in a course and your progress will appear here." />
            ) : null}
            {inProgress.map(item => {
              const originalIndex = enrollments.data?.findIndex(row => row.id === item.id) ?? -1;
              const course = originalIndex >= 0 ? courseQueries[originalIndex]?.data : undefined;
              return <CourseProgressCard key={item.id} enrollment={item} title={course?.title ?? 'Your course'} letter={course?.letter} tone={originalIndex % 2 ? 'mint' : 'blue'} onPress={() => openEnrollment(item)} />;
            })}
          </View>
        ) : null}

        {showResults ? (
          <ClayCard variant="green" style={styles.resultsCard} onPress={showLearnerUnavailable}>
            <View style={styles.resultsIcon}><Icon name="trophy" size={22} color={colors.success} /></View>
            <View style={styles.grow}>
              <AppText weight="900" size={14} color={colors.navy}>Test performance</AppText>
              <AppText size={11} color={colors.text2} style={styles.metaTop}>Review scores and revisit completed tests</AppText>
            </View>
            <Icon name="chev" size={16} color={colors.success} />
          </ClayCard>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title={savedTitle} action={filter === 'All' ? 'See all' : undefined} onPress={() => setFilter('All')} />
          {bookmarks.isLoading ? <LoadingBlock /> : null}
          {bookmarks.isError ? <ErrorState message="Saved items could not be loaded." onRetry={() => { bookmarks.refetch(); }} /> : null}
          {!bookmarks.isLoading && !bookmarks.isError && !savedItems.length ? (
            <EmptyState title="Nothing saved yet" body="Bookmark courses, stories and facts to find them here." />
          ) : null}
          {savedItems.map(item => (
            <SavedItemCard key={item.id} item={item} onPress={() => openBookmark(item)} onRemove={() => confirmRemove(item)} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function LearningChip({label, icon, tone, selected, onPress}: {label: LearningFilter; icon?: IconName; tone?: 'green' | 'orange'; selected: boolean; onPress: () => void}) {
  const tint = tone === 'green' ? colors.success : tone === 'orange' ? colors.orange : colors.navy;
  const background = tone === 'green' ? colors.pastel.green : tone === 'orange' ? colors.pastel.orange : colors.subtle;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={({pressed}) => [styles.chip, {backgroundColor: selected ? colors.primary : background}, pressed && styles.pressed]}>
      {icon ? <View style={[styles.chipIcon, selected && styles.chipIconSelected]}><Icon name={icon} size={12} color={selected ? '#fff' : tint} /></View> : null}
      <AppText weight="800" size={11.5} color={selected ? '#fff' : tint}>{label}</AppText>
    </Pressable>
  );
}

function SectionHeader({title, action, onPress}: {title: string; action?: string; onPress?: () => void}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText weight="900" size={16.5} color={colors.navy}>{title}</AppText>
      {action ? <Pressable onPress={onPress} hitSlop={8}><AppText weight="800" size={11.5} color={colors.primary}>{action}</AppText></Pressable> : null}
    </View>
  );
}

function CourseProgressCard({enrollment, title, letter, tone, onPress}: {enrollment: Enrollment; title: string; letter?: string; tone: 'blue' | 'mint'; onPress: () => void}) {
  const mint = tone === 'mint';
  const accent = mint ? '#00897B' : colors.primary;
  const total = enrollment.progress.totalLessons;
  return (
    <ClayCard variant="white" padded={false} style={styles.courseCard} onPress={onPress}>
      <View style={[styles.courseThumb, {backgroundColor: mint ? colors.pastel.mint : colors.pastel.blue}]}>
        <AppText weight="900" size={22} color={mint ? '#00695C' : colors.deepBlue}>{letter ?? title.charAt(0).toUpperCase()}</AppText>
        <AppText weight="800" size={7} color={colors.text2} numberOfLines={1}>{title.split(' ').slice(0, 2).join(' ').toUpperCase()}</AppText>
      </View>
      <View style={styles.courseBody}>
        <View style={styles.courseTitleRow}>
          <AppText weight="900" size={13} color={colors.navy} numberOfLines={1} style={styles.grow}>{title}</AppText>
          <AppText weight="900" size={10} color={accent}>{enrollment.progress.percent}%</AppText>
        </View>
        <View style={styles.progressRow}>
          <ProgressBar percent={enrollment.progress.percent} height={8} />
          <AppText weight="700" size={9} color={colors.text2}>{enrollment.progress.completedLessons}/{total}</AppText>
        </View>
      </View>
      <Gradient colors={mint ? ['#4DB6AC', '#00897B'] : gradients.play} style={styles.playButton}>
        <Icon name="play" size={17} color="#fff" filled />
      </Gradient>
    </ClayCard>
  );
}

function SavedItemCard({item, onPress, onRemove}: {item: Bookmark; onPress: () => void; onRemove: () => void}) {
  const presentation = bookmarkPresentation[item.ref.kind];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => [styles.savedCard, pressed && styles.pressed]}>
      <Gradient colors={presentation.background} style={styles.savedThumb}>
        <Icon name={presentation.icon} size={23} color="#fff" />
      </Gradient>
      <View style={styles.savedBody}>
        <AppText weight="800" size={12.5} color={colors.navy} numberOfLines={2}>{item.title}</AppText>
        <View style={styles.savedMeta}>
          <AppText size={9.5} color={colors.text2}>{item.subtitle ?? 'Saved for later'}</AppText>
          <View style={styles.metaDot} />
          <AppText size={9.5} color={colors.text2}>Saved</AppText>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.title} from saved items`} hitSlop={10} onPress={event => { event.stopPropagation(); onRemove(); }} style={styles.bookmarkButton}>
        <Icon name="bookmark" size={17} color={presentation.color} filled />
      </Pressable>
    </Pressable>
  );
}

const styles = createThemedStyles({
  page: {paddingTop: 14, paddingHorizontal: space.pageX, paddingBottom: 30, gap: 15},
  guestPage: {flex: 1, justifyContent: 'center', padding: space.pageX},
  guestCard: {alignItems: 'center', padding: 22, gap: 12},
  guestIcon: {width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pastel.blue},
  guestCopy: {maxWidth: 290, lineHeight: 19},
  hero: {minHeight: 148, borderRadius: radius.hero, flexDirection: 'row', overflow: 'hidden', boxShadow: '0 16px 26px -14px rgba(27,94,32,0.6)'},
  heroCopy: {flex: 1, padding: 16, gap: 9, justifyContent: 'center', zIndex: 1},
  heroBolt: {position: 'absolute', right: 17, top: 28, opacity: 0.88},
  streakRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  streakDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFEE58', boxShadow: '0 0 0 3px rgba(255,238,88,0.28)'},
  streakPill: {borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5},
  tracking: {letterSpacing: 0.9},
  summaryRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  resumeButton: {alignSelf: 'flex-start', minHeight: 34, borderRadius: 10, backgroundColor: colors.orange, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 8px 14px -6px rgba(230,81,0,0.75)'},
  disabled: {opacity: 0.6},
  pressed: {opacity: 0.82},
  filters: {gap: 8, paddingRight: 8},
  chip: {minHeight: 38, borderRadius: 999, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  chipIcon: {width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'},
  chipIconSelected: {backgroundColor: 'rgba(255,255,255,0.2)'},
  section: {gap: 10},
  sectionHeader: {minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  courseCard: {minHeight: 84, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 19},
  courseThumb: {width: 58, height: 58, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, gap: 1},
  courseBody: {flex: 1, minWidth: 0, gap: 8},
  courseTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  grow: {flex: 1, minWidth: 0},
  playButton: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 18px -7px rgba(21,101,192,0.65)'},
  resultsCard: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  resultsIcon: {width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  metaTop: {marginTop: 4},
  savedCard: {minHeight: 74, borderRadius: 17, backgroundColor: '#fff', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11, boxShadow: clayShadow('white')},
  savedThumb: {width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  savedBody: {flex: 1, minWidth: 0, gap: 7},
  savedMeta: {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'},
  metaDot: {width: 3, height: 3, borderRadius: 2, backgroundColor: colors.text3},
  bookmarkButton: {width: 32, height: 40, alignItems: 'center', justifyContent: 'center'},
});
