import {createThemedStyles} from '../../theme';
import React,
  { useEffect,
  useMemo,
  useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRepositories } from '../../core/di';
import { queryClient, queryKeys } from '../../core/query';
import { useAsyncAction } from '../../core/useAsyncAction';
import {
  accountKey,
  isAuthenticated,
  useSessionStore,
} from '../../core/session';
import { getAccountScoped, setAccountScoped } from '../../core/storage';
import { colors, gradients, radius, space } from '../../theme';
import {
  AccessBadge,
  AppText,
  ClayButton,
  EmptyState,
  ErrorState,
  LoadingBlock,
  ProgressBar,
} from '../../components/ui';
import { ClayCard, ClayIconTile } from '../../components/ui/Clay';
import { Gradient } from '../../components/ui/Gradient';
import {
  DetailHeader,
  Screen,
  StickyActionFooter,
} from '../../components/layout/Screen';
import { shareService } from '../../core/services';
import type { Lesson } from '../../core/types';
import type { HomeNav } from '../../navigation/types';
import { Icon } from '../../assets/icons';

type CourseTab = 'lessons' | 'overview' | 'reviews';

export function CourseDetailScreen() {
  const navigation = useNavigation<HomeNav>();
  const courseId = (useRoute().params as { courseId: string }).courseId;
  const repos = useRepositories();
  const sessionStatus = useSessionStore(state => state.status);
  const userKey = accountKey();
  const [tab, setTab] = useState<CourseTab>('lessons');
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState(false);

  const course = useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: () => repos.catalog.course(courseId),
  });
  const lessons = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => repos.learning.lessons(courseId),
  });
  const bookmarks = useQuery({
    queryKey: queryKeys.bookmarks(userKey),
    queryFn: () => repos.learning.bookmarks(),
    enabled: sessionStatus === 'authenticated',
  });
  const data = course.data;
  const bookmarked = Boolean(
    bookmarks.data?.some(
      item => item.ref.kind === 'course' && item.ref.id === courseId,
    ),
  );

  useEffect(() => {
    if (!data?.instructor) return;
    let current = true;
    void getAccountScoped(
      userKey,
      `instructor.${data.instructor.id}.following`,
      Boolean(data.instructor.following),
    ).then(saved => {
      if (current) setFollowing(saved);
    });
    return () => {
      current = false;
    };
  }, [data?.instructor, userKey]);

  const bookmark = useMutation({
    mutationFn: (nextSaved: boolean) =>
      repos.learning.setBookmark({ kind: 'course', id: courseId }, nextSaved),
    onSuccess: async (_, nextSaved) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bookmarks(userKey),
      });
      Alert.alert(
        nextSaved ? 'Course saved' : 'Course removed',
        nextSaved
          ? 'You can find it in My Learning.'
          : 'It was removed from your saved courses.',
      );
    },
    onError: () =>
      Alert.alert('Could not update saved course', 'Please try again.'),
  });

  const allLessons = useMemo(() => lessons.data ?? [], [lessons.data]);
  const nextLesson = useMemo(
    () =>
      allLessons.find(item => item.id === data?.progress?.nextLessonId) ??
      allLessons.find(
        item =>
          item.state === 'current' ||
          item.state === 'available' ||
          item.state === 'preview',
      ),
    [allLessons, data?.progress?.nextLessonId],
  );
  const visibleLessons = useMemo(() => {
    if (showAllLessons || allLessons.length <= 6) return allLessons;
    const currentIndex = allLessons.findIndex(
      item => item.id === nextLesson?.id,
    );
    if (currentIndex < 3) return allLessons.slice(0, 6);
    return [
      ...allLessons.slice(0, 3),
      ...allLessons.slice(currentIndex, currentIndex + 3),
    ].filter(
      (item, index, items) =>
        items.findIndex(candidate => candidate.id === item.id) === index,
    );
  }, [allLessons, nextLesson?.id, showAllLessons]);

  const openLesson = (lesson: Lesson) => {
    if (lesson.state === 'locked') {
      Alert.alert(
        'Lesson locked',
        data?.pricing === 'paid' && !data.purchased
          ? 'Buy this course to unlock the complete lesson plan.'
          : 'Complete the previous lesson to unlock this one.',
      );
      return;
    }
    if (!isAuthenticated() && lesson.state !== 'preview') {
      useSessionStore
        .getState()
        .setPendingDestination({ kind: 'course', id: courseId });
      useSessionStore.getState().showLogin();
      return;
    }
    navigation.navigate('LessonPlayer', { courseId, lessonId: lesson.id });
  };

  const action = useAsyncAction(async () => {
    if (!data) return;
    if (
      data.access.reason === 'login_required' ||
      (!isAuthenticated() && (data.pricing === 'paid' || !data.enrolled))
    ) {
      useSessionStore
        .getState()
        .setPendingDestination({ kind: 'course', id: courseId });
      useSessionStore.getState().showLogin();
      return;
    }
    if (data.isSemester) {
      throw new Error('Semester learning is not available in the app yet.');
    }
    if (
      data.access.reason === 'purchase_required' ||
      (data.pricing === 'paid' &&
        !data.purchased &&
        data.access.state !== 'granted')
    ) {
      throw new Error('This course needs an active entitlement. Checkout is not available in the app yet.');
    }
    if (!data.enrolled && isAuthenticated()) {
      await repos.learning.enroll(courseId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.course(courseId),
      });
    }
    const availableLessons = await repos.learning.lessons(courseId);
    const next =
      availableLessons.find(lesson => lesson.id === data.progress?.nextLessonId)
        ?.id ??
      availableLessons.find(
        lesson => lesson.state === 'current' || lesson.state === 'available',
      )?.id;
    if (next) {
      navigation.navigate('LessonPlayer', { courseId, lessonId: next });
    } else {
      throw new Error('No lessons are available yet. Please check back later.');
    }
  });

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        course.refetch(),
        lessons.refetch(),
        sessionStatus === 'authenticated'
          ? bookmarks.refetch()
          : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };
  const pullRefresh = usePullRefreshFeedback({
    refreshing,
    onRefresh: refresh,
  });

  const toggleBookmark = () => {
    if (!isAuthenticated()) {
      useSessionStore
        .getState()
        .setPendingDestination({ kind: 'course', id: courseId });
      useSessionStore.getState().showLogin();
      return;
    }
    if (!bookmark.isPending) bookmark.mutate(!bookmarked);
  };

  const toggleFollow = async () => {
    if (!data?.instructor) return;
    if (!isAuthenticated()) {
      useSessionStore
        .getState()
        .setPendingDestination({ kind: 'course', id: courseId });
      useSessionStore.getState().showLogin();
      return;
    }
    const next = !following;
    setFollowing(next);
    await setAccountScoped(
      userKey,
      `instructor.${data.instructor.id}.following`,
      next,
    );
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Course Detail"
        subtitle="Computer Courses"
        onBack={() => navigation.goBack()}
        onShare={() =>
          shareService.share(
            data ? `${data.title} on RACI` : 'Explore this course on RACI',
          )
        }
        onBookmark={toggleBookmark}
        bookmarkActive={bookmarked}
      />
      {course.isLoading ? <LoadingBlock /> : null}
      {course.isError ? (
        <ErrorState
          message="Could not load this course."
          onRetry={() => course.refetch()}
        />
      ) : null}
      {data ? (
        <>
          <ScrollView
            {...pullRefresh.scrollProps}
            contentContainerStyle={styles.page}
            showsVerticalScrollIndicator={false}
          >
            {action.error ? (
              <AppText accessibilityRole="alert" color={colors.error}>
                {action.error}
              </AppText>
            ) : null}

            <ClayCard variant="blue" style={styles.hero}>
              {data.imageUrl ? (
                <Image
                  source={{ uri: data.imageUrl }}
                  style={styles.courseHeroImage}
                  resizeMode="cover"
                  accessible
                  accessibilityLabel={`Artwork for ${data.title}`}
                />
              ) : null}
              <View style={styles.heroTop}>
                <ClayIconTile
                  icon={data.icon as never}
                  color={data.iconColor ?? colors.deepBlue}
                  letter={data.letter ?? data.title.charAt(0)}
                  size={64}
                />
                <View style={styles.heroCopy}>
                  <AppText
                    weight="900"
                    size={17}
                    color={colors.navy}
                    style={styles.heroTitle}
                  >
                    {data.title}
                  </AppText>
                  <AccessBadge
                    pricing={data.purchased ? 'purchased' : data.pricing}
                  />
                </View>
              </View>
              <View style={styles.heroMeta}>
                <Meta icon="star" color="#F9A825">
                  {data.rating?.toFixed(1) ?? '—'} Rating
                </Meta>
                <Meta icon="users" color={colors.primary}>
                  {formatCount(data.learnerCount)} Learners
                </Meta>
                <Meta icon="clock" color="#7B1FA2">
                  {(data.lessonCount ?? allLessons.length) || '—'} Lessons
                </Meta>
              </View>
            </ClayCard>

            {data.progress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Resume ${nextLesson?.title ?? data.title}`}
                onPress={() => nextLesson && openLesson(nextLesson)}
                style={({ pressed }) => [
                  styles.progressCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.courseThumb}>
                  <AppText
                    face="caveat"
                    weight="700"
                    size={18}
                    color={colors.deepBlue}
                  >
                    {data.title.charAt(0)}
                  </AppText>
                  <AppText weight="700" size={7.5} color={colors.text2}>
                    COURSE
                  </AppText>
                </View>
                <View style={styles.progressBody}>
                  <View style={styles.progressHeading}>
                    <AppText weight="800" size={13} color={colors.navy}>
                      Your Progress
                    </AppText>
                    <AppText weight="700" size={10} color={colors.text2}>
                      {data.progress.percent}%
                    </AppText>
                  </View>
                  <View style={styles.progressRow}>
                    <ProgressBar percent={data.progress.percent} />
                    <AppText weight="800" size={9} color={colors.text2}>
                      {data.progress.completedLessons}/
                      {data.progress.totalLessons}
                    </AppText>
                  </View>
                  <AppText size={9.5} color={colors.text2} numberOfLines={1}>
                    Next: {nextLesson?.title ?? 'Course lesson'}
                  </AppText>
                </View>
                <Gradient colors={gradients.play} style={styles.playButton}>
                  <Icon name="play" size={18} color="#fff" />
                </Gradient>
              </Pressable>
            ) : null}

            <View style={styles.tabs} accessibilityRole="tablist">
              {(['lessons', 'overview', 'reviews'] as const).map(item => (
                <Pressable
                  key={item}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === item }}
                  onPress={() => setTab(item)}
                  style={[styles.tab, tab === item && styles.tabOn]}
                >
                  <AppText
                    weight="800"
                    size={11}
                    color={tab === item ? colors.navy : colors.text2}
                  >
                    {item[0].toUpperCase() + item.slice(1)}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {tab === 'lessons' ? (
              <>
                <SectionHeader
                  title="Course Content"
                  action={
                    allLessons.length > 6
                      ? showAllLessons
                        ? 'Show less'
                        : `Show all ${allLessons.length}`
                      : undefined
                  }
                  onAction={() => setShowAllLessons(value => !value)}
                />
                {lessons.isLoading ? <LoadingBlock /> : null}
                {lessons.isError ? (
                  <ErrorState
                    message="Could not load the course lessons."
                    onRetry={() => lessons.refetch()}
                  />
                ) : null}
                <View style={styles.lessonList}>
                  {visibleLessons.map(lesson => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      onPress={() => openLesson(lesson)}
                    />
                  ))}
                </View>
                {!lessons.isLoading &&
                !lessons.isError &&
                allLessons.length === 0 ? (
                  <EmptyState
                    title="Lessons are on the way"
                    body="The course team is preparing this lesson plan."
                  />
                ) : null}

                {data.instructor ? (
                  <>
                    <SectionHeader title="Instructor" />
                    <ClayCard variant="yellow">
                      <View style={styles.instructorRow}>
                        <ClayIconTile icon="teacher" color={colors.orange} />
                        <View style={styles.instructorCopy}>
                          <AppText weight="800" size={13} color={colors.navy}>
                            {data.instructor.name}
                          </AppText>
                          <AppText size={10.5} color={colors.text2}>
                            {[
                              data.instructor.title,
                              data.instructor.experience,
                              data.instructor.rating
                                ? `${data.instructor.rating} rating`
                                : undefined,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </AppText>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: following }}
                          onPress={() => void toggleFollow()}
                          hitSlop={8}
                          style={[
                            styles.followBadge,
                            following && styles.followingBadge,
                          ]}
                        >
                          <AppText
                            weight="800"
                            size={8}
                            color={following ? colors.success : '#EF6C00'}
                            style={styles.badgeTracking}
                          >
                            {following ? 'FOLLOWING' : 'FOLLOW'}
                          </AppText>
                        </Pressable>
                      </View>
                    </ClayCard>
                  </>
                ) : null}
              </>
            ) : null}

            {tab === 'overview' ? (
              <OverviewTab
                description={data.description}
                outcomes={data.outcomes}
                prerequisites={data.prerequisites}
              />
            ) : null}

            {tab === 'reviews' ? (
              <ReviewsTab
                rating={data.rating}
                learnerCount={data.learnerCount}
              />
            ) : null}
          </ScrollView>
          <StickyActionFooter>
            <View style={styles.footerRow}>
              <View style={styles.footerPrice}>
                <AppText
                  weight="800"
                  size={13}
                  color={
                    data.pricing === 'free' ? colors.success : colors.orange
                  }
                >
                  {data.purchased
                    ? 'Purchased'
                    : data.pricing === 'free'
                    ? 'Free Course'
                    : 'Paid Course'}
                </AppText>
                <AppText size={9.5} color={colors.text2}>
                  {data.enrolled || data.purchased
                    ? 'Ready to continue'
                    : 'Start learning today'}
                </AppText>
              </View>
              <ClayButton
                label={
                  action.busy
                    ? 'Opening…'
                    : data.purchased || data.enrolled
                    ? 'Continue Learning'
                    : data.pricing === 'paid'
                    ? 'Buy this course'
                    : 'Enroll for free'
                }
                disabled={action.busy}
                onPress={() => void action.run()}
                style={styles.footerButton}
              />
            </View>
          </StickyActionFooter>
        </>
      ) : null}
    </Screen>
  );
}

function Meta({
  icon,
  color,
  children,
}: {
  icon: 'star' | 'users' | 'clock';
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.metaItem}>
      <Icon name={icon} size={14} color={color} />
      <AppText weight="600" size={10.5} color={colors.text2}>
        {children}
      </AppText>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText weight="800" size={16.5} color={colors.navy}>
        {title}
      </AppText>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText weight="700" size={11.5} color={colors.primary}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function LessonRow({
  lesson,
  onPress,
}: {
  lesson: Lesson;
  onPress: () => void;
}) {
  const status = lesson.state;
  const icon =
    status === 'completed' ? 'check' : status === 'locked' ? 'lock' : 'play';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lesson.title}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.lessonRow, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.lessonIcon,
          status === 'completed'
            ? styles.lessonDone
            : status === 'locked'
            ? styles.lessonLocked
            : styles.lessonCurrent,
        ]}
      >
        <Icon
          name={icon}
          size={status === 'completed' ? 17 : 16}
          color={
            status === 'completed'
              ? colors.success
              : status === 'locked'
              ? '#B0BEC5'
              : colors.activeBlue
          }
        />
      </View>
      <View style={styles.lessonCopy}>
        <AppText weight="800" size={11.5} color={colors.navy} numberOfLines={2}>
          {lesson.title}
        </AppText>
        <AppText size={9.5} color={colors.text2}>
          {formatDuration(lesson.durationSeconds)}
          {status === 'preview' ? ' · Free preview' : ''}
        </AppText>
      </View>
      {status === 'current' ? (
        <View style={styles.resumeBadge}>
          <AppText
            weight="800"
            size={8}
            color={colors.activeBlue}
            style={styles.badgeTracking}
          >
            RESUME
          </AppText>
        </View>
      ) : null}
      {status === 'available' || status === 'preview' ? (
        <Icon name="chev" size={13} color={colors.text3} />
      ) : null}
    </Pressable>
  );
}

function OverviewTab({
  description,
  outcomes,
  prerequisites,
}: {
  description?: string;
  outcomes?: string[];
  prerequisites?: string[];
}) {
  return (
    <View style={styles.tabContent}>
      <SectionHeader title="About this course" />
      <ClayCard variant="white">
        <AppText size={12.5} color={colors.text2} style={styles.bodyCopy}>
          {description ?? 'A detailed course overview will be available soon.'}
        </AppText>
      </ClayCard>
      {outcomes?.length ? (
        <>
          <SectionHeader title="What you’ll learn" />
          <ClayCard variant="green">
            {outcomes.map(outcome => (
              <View key={outcome} style={styles.bulletRow}>
                <Icon name="check" size={15} color={colors.success} />
                <AppText size={12} color={colors.ink} style={styles.bulletCopy}>
                  {outcome}
                </AppText>
              </View>
            ))}
          </ClayCard>
        </>
      ) : null}
      <SectionHeader title="Requirements" />
      <ClayCard variant="sky">
        {(prerequisites?.length
          ? prerequisites
          : ['No prior experience is required.']
        ).map(item => (
          <View key={item} style={styles.bulletRow}>
            <Icon name="check" size={15} color={colors.primary} />
            <AppText size={12} color={colors.ink} style={styles.bulletCopy}>
              {item}
            </AppText>
          </View>
        ))}
      </ClayCard>
    </View>
  );
}

function ReviewsTab({
  rating,
  learnerCount,
}: {
  rating?: number;
  learnerCount?: number;
}) {
  return (
    <View style={styles.tabContent}>
      <SectionHeader title="Learner Reviews" />
      <ClayCard variant="yellow" style={styles.reviewCard}>
        <Icon name="star" size={28} color="#F9A825" />
        <View style={styles.reviewCopy}>
          <AppText weight="900" size={24} color={colors.navy}>
            {rating?.toFixed(1) ?? 'New'}
          </AppText>
          <AppText size={11} color={colors.text2}>
            Course rating · {formatCount(learnerCount)} learners
          </AppText>
        </View>
      </ClayCard>
      <EmptyState
        title="No written reviews yet"
        body="This course does not have any published learner reviews."
      />
    </View>
  );
}

function formatCount(value?: number) {
  return typeof value === 'number' ? value.toLocaleString('en-IN') : '—';
}

function formatDuration(seconds?: number) {
  if (!seconds) return 'Duration unavailable';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')} min`;
}

const styles = createThemedStyles({
  page: { padding: space.pageX, gap: 12, paddingBottom: 26 },
  hero: { padding: 17, borderRadius: radius.hero, gap: 11 },
  courseHeroImage: { width: '100%', height: 148, borderRadius: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  heroCopy: { flex: 1, gap: 7 },
  heroTitle: { letterSpacing: -0.3, lineHeight: 21 },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, rowGap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 19,
    backgroundColor: '#fff',
    boxShadow:
      '0 16px 26px -14px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.14)',
  },
  courseThumb: {
    width: 58,
    height: 58,
    borderRadius: 15,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.pastel.blue,
    boxShadow:
      'inset 3px 3px 7px rgba(255,255,255,0.8), inset -3px -3px 7px rgba(21,101,192,0.14)',
  },
  progressBody: { flex: 1, minWidth: 0, gap: 6 },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      '0 10px 18px -6px rgba(21,101,192,0.6), inset 2px 2px 5px rgba(255,255,255,0.4), inset -2px -2px 5px rgba(13,71,161,0.4)',
  },
  tabs: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: colors.pressed,
    borderRadius: 15,
    padding: 5,
    boxShadow:
      'inset 3px 3px 8px rgba(148,163,184,0.3), inset -2px -2px 6px rgba(255,255,255,0.85)',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11 },
  tabOn: {
    backgroundColor: '#fff',
    boxShadow:
      '0 6px 12px -5px rgba(26,35,126,0.3), inset 2px 2px 5px rgba(255,255,255,0.9), inset -1px -1px 4px rgba(100,116,139,0.1)',
  },
  sectionHeader: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lessonList: { gap: 10 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#fff',
    boxShadow:
      '0 14px 24px -14px rgba(26,35,126,0.26), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.12)',
  },
  lessonIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      'inset 3px 3px 7px rgba(255,255,255,0.85), inset -3px -3px 7px rgba(100,116,139,0.18), 4px 5px 10px -6px rgba(26,35,126,0.28)',
  },
  lessonDone: { backgroundColor: colors.pastel.green },
  lessonCurrent: { backgroundColor: colors.pastel.blue },
  lessonLocked: { backgroundColor: colors.subtle },
  lessonCopy: { flex: 1, minWidth: 0, gap: 4 },
  resumeBadge: {
    backgroundColor: colors.pastel.blue,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  badgeTracking: { letterSpacing: 0.8 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  instructorCopy: { flex: 1, minWidth: 0, gap: 3 },
  followBadge: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: colors.pastel.orange,
  },
  followingBadge: { backgroundColor: colors.pastel.green },
  tabContent: { gap: 12 },
  bodyCopy: { lineHeight: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  bulletCopy: { flex: 1, lineHeight: 18 },
  reviewCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reviewCopy: { flex: 1, gap: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerPrice: { flex: 1, minWidth: 0, gap: 3 },
  footerButton: { flexShrink: 0 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
