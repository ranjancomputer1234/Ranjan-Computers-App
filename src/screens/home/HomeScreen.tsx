import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import { useNavigation } from '@react-navigation/native';
import { colors, gradients, space } from '../../theme';
import {
  AppText,
  ClayButton,
  ErrorState,
  LoadingBlock,
  ProgressBar,
  SearchInput,
} from '../../components/ui';
import { BrandedHeader, Screen } from '../../components/layout/Screen';
import { CourseCatalogCard, ExploreTile } from '../../components/content/Cards';
import { Gradient } from '../../components/ui/Gradient';
import { BooksArt, Chalkboard, TeacherArt } from '../../assets/illustrations';
import { ICON_NAMES, Icon, type IconName } from '../../assets/icons';
import type { HomeNav } from '../../navigation/types';
import type { CatalogItem, LiveClass } from '../../core/types';
import { ClayCard } from '../../components/ui/Clay';
import { openPublishedTarget, showLearnerUnavailable } from '../../features/catalog/openPublishedTarget';
import { useHomeDashboard } from '../../features/home/hooks/useHomeDashboard';

function liveTimeLabel(item: LiveClass) {
  if (item.status === 'live') return 'Live now';
  if (item.status === 'starting') return 'Starting now';
  if (item.status === 'reconnecting') return 'Reconnecting';
  if (item.status === 'ended' && item.recordingAvailable)
    return 'Recording available';
  if (item.status === 'cancelled') return 'Class cancelled';

  const startsAt = new Date(item.startsAt);
  if (Number.isNaN(startsAt.getTime())) return 'Schedule to be announced';
  return `Starts ${startsAt.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function liveActionLabel(item: LiveClass) {
  if (item.status === 'ended' && item.recordingAvailable) return 'Watch Replay';
  if (item.status === 'scheduled') return 'View Class';
  return 'Join Now';
}

function sectionIcon(item: CatalogItem): IconName {
  return ICON_NAMES.includes(item.icon as IconName)
    ? (item.icon as IconName)
    : 'bookopen';
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { width } = useWindowDimensions();
  const { status, homeQuery, name, liveClasses } = useHomeDashboard();
  const pullRefresh = usePullRefreshFeedback({
    refreshing: homeQuery.isRefetching && !homeQuery.isLoading,
    onRefresh: () => {
      homeQuery.refetch().catch(() => undefined);
    },
  });
  const [activeLive, setActiveLive] = React.useState(0);
  const liveRef = React.useRef<ScrollViewInstance>(null);
  const bannerWidth = Math.max(288, Math.min(width, 760) - space.pageX * 2);
  const continuing = homeQuery.data?.continueLearning ?? [];
  const sections = homeQuery.data?.sections.slice(0, 6) ?? [];
  const featuredCourses = homeQuery.data?.featuredCourses ?? [];
  const primaryBanner = homeQuery.data?.banners[0];

  React.useEffect(() => {
    if (activeLive >= liveClasses.length) setActiveLive(0);
  }, [activeLive, liveClasses.length]);

  const openResume = React.useCallback((item: (typeof continuing)[number]) => {
    navigation.navigate('LessonPlayer', {
      courseId: item.courseId,
      lessonId: item.lessonId,
      enrollmentId: item.enrollmentId,
    });
  }, [navigation]);

  const openLearningActions = React.useCallback((item: (typeof continuing)[number]) => {
    Alert.alert(item.title, 'Choose where you want to continue.', [
      { text: 'Resume lesson', onPress: () => openResume(item) },
      {
        text: 'View course',
        onPress: () =>
          navigation.navigate('CourseDetail', { courseId: item.courseId }),
      },
      {
        text: 'My Learning',
        onPress: () => navigation.getParent()?.navigate('LearningTab'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [navigation, openResume]);

  const updateLivePage = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveLive(Math.round(event.nativeEvent.contentOffset.x / bannerWidth));
  };

  const showLivePage = (index: number) => {
    setActiveLive(index);
    liveRef.current?.scrollTo({ x: index * bannerWidth, animated: true });
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <BrandedHeader
        unread={(homeQuery.data?.unreadNotifications ?? 0) > 0}
        onNotifications={showLearnerUnavailable}
        onProfile={() => navigation.getParent()?.navigate('ProfileTab')}
      />
      <ScrollView
        {...pullRefresh.scrollProps}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <AppText weight="900" size={23} color={colors.navy}>
            Hello, {name}!
          </AppText>
          <AppText size={12.5} color={colors.text2} style={styles.greetingSub}>
            What would you like to learn today?
          </AppText>
        </View>

        <SearchInput
          placeholder="Search courses, news and facts"
          onPress={() => navigation.navigate('Search')}
        />

        {primaryBanner ? (
          <Gradient
            colors={gradients.banner}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.marketingBanner}
          >
            <View style={styles.marketingCopy}>
              <AppText weight="900" size={19} color="#fff" numberOfLines={2}>
                {primaryBanner.title}
              </AppText>
              {primaryBanner.subtitle ? (
                <AppText size={11} color="rgba(255,255,255,0.86)" numberOfLines={2}>
                  {primaryBanner.subtitle}
                </AppText>
              ) : null}
            </View>
            {primaryBanner.targetId ? (
              <ClayButton
                label={primaryBanner.ctaLabel || 'Open'}
                tone="orange"
                compact
                icon="chev"
                onPress={() =>
                  openPublishedTarget(
                    navigation,
                    primaryBanner.targetKind,
                    primaryBanner.targetId,
                  )
                }
              />
            ) : null}
          </Gradient>
        ) : null}

        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse free courses"
            style={({ pressed }) => [
              styles.tog,
              styles.freeToggle,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('ComputerCourses', { pricing: 'free' })
            }
          >
            <View
              style={[styles.cc, { backgroundColor: colors.successAccent }]}
            >
              <Icon name="gradcap" size={13} color="#fff" />
            </View>
            <AppText weight="800" size={11.5} color={colors.success}>
              Free Courses
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse paid courses"
            style={({ pressed }) => [
              styles.tog,
              styles.paidToggle,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('ComputerCourses', { pricing: 'paid' })
            }
          >
            <View style={[styles.cc, { backgroundColor: colors.orange }]}>
              <AppText weight="900" size={12} color="#fff">
                ₹
              </AppText>
            </View>
            <AppText weight="800" size={11.5} color="#EF6C00">
              Paid Courses
            </AppText>
          </Pressable>
        </View>

        {homeQuery.isError ? (
          <ErrorState
            message="Home could not load."
            onRetry={() => homeQuery.refetch()}
          />
        ) : liveClasses.length ? (
          <View style={styles.liveSection}>
            <ScrollView
              ref={liveRef}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              decelerationRate="fast"
              snapToInterval={bannerWidth}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={updateLivePage}
              accessibilityLabel="Live classes carousel"
            >
              {liveClasses.map(item => (
                <View key={item.id} style={{ width: bannerWidth }}>
                  <Gradient
                    colors={gradients.banner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.banner}
                  >
                    <View style={styles.bleft}>
                      <View style={styles.bltop}>
                        <View style={styles.livePulse}>
                          <View style={styles.livedot} />
                        </View>
                        <Gradient
                          colors={gradients.orangeCta}
                          style={styles.pill}
                        >
                          <AppText
                            weight="800"
                            size={9}
                            color="#fff"
                            style={styles.liveLabel}
                          >
                            {item.status === 'ended'
                              ? 'RECORDING'
                              : 'LIVE CLASS'}
                          </AppText>
                        </Gradient>
                      </View>
                      <AppText
                        weight="900"
                        size={19}
                        color="#fff"
                        numberOfLines={2}
                      >
                        {item.title}
                      </AppText>
                      <View style={styles.time}>
                        <Icon
                          name="cal"
                          size={13}
                          color="rgba(255,255,255,0.85)"
                        />
                        <AppText
                          size={10.5}
                          weight="600"
                          color="rgba(255,255,255,0.85)"
                          style={styles.timeText}
                          numberOfLines={1}
                        >
                          {liveTimeLabel(item)}
                        </AppText>
                      </View>
                      <ClayButton
                        label={liveActionLabel(item)}
                        tone="orange"
                        compact
                        icon="chev"
                        disabled={item.status === 'cancelled'}
                        style={styles.liveButton}
                        onPress={showLearnerUnavailable}
                      />
                    </View>
                    <View style={styles.bvisual}>
                      <View style={styles.chalk}>
                        <Chalkboard />
                      </View>
                      <View style={styles.teacher}>
                        <TeacherArt />
                      </View>
                      <View style={styles.books}>
                        <BooksArt />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${liveActionLabel(item)}: ${
                          item.title
                        }`}
                        onPress={showLearnerUnavailable}
                        style={({ pressed }) => [
                          styles.playover,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Icon name="play" size={20} color="#fff" filled />
                      </Pressable>
                    </View>
                  </Gradient>
                </View>
              ))}
            </ScrollView>
            {liveClasses.length > 1 ? (
              <View style={styles.dots} accessibilityRole="tablist">
                {liveClasses.map((item, index) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityLabel={`Show ${item.title}`}
                    accessibilityState={{ selected: activeLive === index }}
                    hitSlop={8}
                    onPress={() => showLivePage(index)}
                    style={activeLive === index ? styles.dotOn : styles.dot}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : homeQuery.isLoading ? (
          <LoadingBlock />
        ) : null}

        <View style={styles.shead}>
          <AppText weight="800" size={16.5} color={colors.navy}>
            Explore Sections
          </AppText>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.navigate('ExploreSections')}
          >
            <AppText weight="700" size={11.5} color={colors.primary}>
              See all {homeQuery.data?.sections.length ?? 0} &gt;
            </AppText>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {sections.map(item => (
            <ExploreTile
              key={item.id}
              title={item.title}
              icon={sectionIcon(item)}
              clay={item.clay}
              color={item.iconColor || colors.primary}
              onPress={() =>
                openPublishedTarget(
                  navigation,
                  item.targetKind ?? item.kind,
                  item.targetId ?? item.id,
                )
              }
            />
          ))}
        </View>

        {featuredCourses.length ? (
          <View style={styles.featured}>
            <AppText weight="800" size={16.5} color={colors.navy}>
              Featured courses
            </AppText>
            {featuredCourses.map(course => (
              <CourseCatalogCard
                key={course.id}
                item={course}
                onPress={() => navigation.navigate('CourseDetail', {courseId: course.id})}
              />
            ))}
          </View>
        ) : null}

        {status === 'authenticated' && continuing.length ? (
          <>
            <View style={styles.shead}>
              <AppText weight="800" size={16.5} color={colors.navy}>
                Continue Learning
              </AppText>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => navigation.getParent()?.navigate('LearningTab')}
              >
                <AppText weight="700" size={11.5} color={colors.primary}>
                  See All &gt;
                </AppText>
              </Pressable>
            </View>
            {continuing.map(resume => (
            <ClayCard key={resume.lessonId} variant="white" padded={false} style={styles.clcard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Resume ${resume.title}, ${resume.lessonLabel}`}
                onPress={() => openResume(resume)}
                style={({ pressed }) => [
                  styles.clmain,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.clthumb}>
                  <AppText
                    face="caveat"
                    weight="700"
                    size={16}
                    color={colors.deepBlue}
                  >
                    {resume.title.trim().charAt(0).toUpperCase() || 'R'}
                  </AppText>
                  <AppText size={7.5} color={colors.text2}>
                    Course
                  </AppText>
                </View>
                <View style={styles.clbody}>
                  <View style={styles.clrow}>
                    <AppText
                      weight="800"
                      size={13}
                      color={colors.navy}
                      numberOfLines={1}
                      style={styles.courseTitle}
                    >
                      {resume.title}
                    </AppText>
                    <AppText
                      size={9}
                      weight="600"
                      color={colors.text2}
                      numberOfLines={1}
                    >
                      {resume.lessonLabel}
                    </AppText>
                  </View>
                  <View style={styles.progressRow}>
                    <ProgressBar percent={resume.percent} />
                    <AppText weight="800" size={9} color={colors.text2}>
                      {resume.percent}%
                    </AppText>
                  </View>
                </View>
              </Pressable>
              <View style={styles.clactions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Resume ${resume.title}`}
                  onPress={() => openResume(resume)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Gradient colors={gradients.play} style={styles.clplay}>
                    <Icon name="play" size={17} color="#fff" filled />
                  </Gradient>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="More learning options"
                  onPress={() => openLearningActions(resume)}
                  style={({ pressed }) => [
                    styles.clmenu,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon name="kebab" size={15} color={colors.text3} />
                </Pressable>
              </View>
            </ClayCard>
            ))}
          </>
        ) : status === 'guest' ? (
          <ClayCard variant="sky">
            <AppText weight="800" size={14} color={colors.navy}>
              Start your first lesson
            </AppText>
            <AppText size={12} color={colors.text2}>
              Browse free courses without an account. Sign in to save progress.
            </AppText>
            <ClayButton
              label="Browse free courses"
              compact
              onPress={() =>
                navigation.navigate('ComputerCourses', { pricing: 'free' })
              }
            />
          </ClayCard>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {
    paddingTop: 14,
    paddingHorizontal: space.pageX,
    paddingBottom: 26,
    gap: 14,
  },
  greetingSub: { marginTop: 6 },
  marketingBanner: {
    minHeight: 118,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  marketingCopy: {gap: 6, maxWidth: 440},
  row: { flexDirection: 'row', gap: 10 },
  tog: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  freeToggle: {
    backgroundColor: colors.pastel.green,
    borderColor: 'rgba(76,175,80,0.5)',
    boxShadow:
      '0 10px 18px -8px rgba(46,125,50,0.5), inset 3px 3px 8px rgba(255,255,255,0.8), inset -3px -3px 8px rgba(46,125,50,0.13)',
  },
  paidToggle: {
    backgroundColor: colors.pastel.orange,
    borderColor: 'rgba(255,152,0,0.45)',
    boxShadow:
      '0 10px 18px -8px rgba(245,124,0,0.5), inset 3px 3px 8px rgba(255,255,255,0.8), inset -3px -3px 8px rgba(230,81,0,0.13)',
  },
  cc: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.82 },
  liveSection: { marginHorizontal: -space.pageX },
  banner: {
    minHeight: 172,
    marginHorizontal: space.pageX,
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    boxShadow:
      '0 22px 36px -16px rgba(13,71,161,0.6), inset 6px 6px 18px rgba(255,255,255,0.18), inset -6px -6px 18px rgba(2,20,60,0.3)',
  },
  bleft: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 4,
    gap: 9,
    justifyContent: 'center',
    zIndex: 2,
  },
  bltop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,230,118,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livedot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E676' },
  pill: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999 },
  liveLabel: { letterSpacing: 1.2 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { flexShrink: 1 },
  liveButton: { alignSelf: 'flex-start' },
  bvisual: { width: 150, position: 'relative' },
  chalk: { position: 'absolute', right: 10, top: 12 },
  teacher: { position: 'absolute', left: 2, bottom: 14, zIndex: 3 },
  books: { position: 'absolute', right: 16, bottom: 12, zIndex: 3 },
  playover: {
    position: 'absolute',
    right: 52,
    top: 34,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    boxShadow:
      '0 10px 20px -6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.3)',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 9,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C5CAE9' },
  dotOn: {
    width: 20,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.brightOrange,
  },
  featured: {gap: 10},
  shead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  clcard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
    borderRadius: 19,
  },
  clmain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clthumb: {
    width: 58,
    height: 58,
    borderRadius: 15,
    backgroundColor: colors.pastel.blue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    boxShadow:
      'inset 3px 3px 7px rgba(255,255,255,0.8), inset -3px -3px 7px rgba(21,101,192,0.14)',
  },
  clbody: { flex: 1, minWidth: 0, gap: 6 },
  clrow: { gap: 4 },
  courseTitle: { minWidth: 0 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clactions: { alignItems: 'center', gap: 7 },
  clplay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clmenu: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.subtle,
  },
});
