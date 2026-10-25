import {createThemedStyles} from '../../theme';
import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Icon, type IconName } from '../../assets/icons';
import {
  DetailHeader,
  Screen,
  StickyActionFooter,
} from '../../components/layout/Screen';
import {
  AccessBadge,
  AppText,
  ClayButton,
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '../../components/ui';
import { ClayCard, ClayIconTile } from '../../components/ui/Clay';
import { useRepositories } from '../../core/di';
import { queryKeys } from '../../core/query';
import { shareService } from '../../core/services';
import type { ClayVariantName, Exam, TestDefinition } from '../../core/types';
import { useBookmark } from '../../core/useBookmark';
import type { HomeNav } from '../../navigation/types';
import { clay, colors, radius, space } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

type ExamTab = 'syllabus' | 'tests' | 'videos';

type SyllabusSection = {
  title: string;
  topics: number;
  icon: IconName;
  tone: ClayVariantName;
  detail: string;
};

type ExamProfile = {
  description: string;
  sections: SyllabusSection[];
};

const commonAwareness: SyllabusSection = {
  title: 'General Awareness',
  topics: 45,
  icon: 'globe',
  tone: 'purple',
  detail: 'Current affairs, static GK, economy and important national events.',
};

const profiles: Record<string, ExamProfile> = {
  banking: {
    description:
      'Complete preparation for major banking recruitment exams with focused concepts, timed mocks and previous-pattern practice.',
    sections: [
      {
        title: 'Reasoning Ability',
        topics: 25,
        icon: 'brain',
        tone: 'blue',
        detail:
          'Puzzles, seating arrangements, inequalities, coding and logical reasoning.',
      },
      {
        title: 'Quantitative Aptitude',
        topics: 30,
        icon: 'chart',
        tone: 'mint',
        detail:
          'Arithmetic, data interpretation, simplification and number series.',
      },
      {
        title: 'English Language',
        topics: 28,
        icon: 'doc',
        tone: 'yellow',
        detail:
          'Reading comprehension, grammar, vocabulary and sentence improvement.',
      },
      commonAwareness,
      {
        title: 'Computer Knowledge',
        topics: 12,
        icon: 'monitor',
        tone: 'cyan',
        detail:
          'Computer fundamentals, internet, office tools and digital banking basics.',
      },
    ],
  },
  railway: {
    description:
      'Prepare for railway recruitment with a balanced plan covering mathematics, reasoning, science and current affairs.',
    sections: [
      {
        title: 'Mathematics',
        topics: 32,
        icon: 'chart',
        tone: 'blue',
        detail:
          'Arithmetic, algebra, geometry, mensuration and data interpretation.',
      },
      {
        title: 'General Intelligence',
        topics: 26,
        icon: 'brain',
        tone: 'mint',
        detail:
          'Analogies, series, classification, puzzles and analytical reasoning.',
      },
      {
        title: 'General Science',
        topics: 30,
        icon: 'flask',
        tone: 'yellow',
        detail:
          'Physics, chemistry and life science concepts at the required level.',
      },
      commonAwareness,
      {
        title: 'Railway Awareness',
        topics: 14,
        icon: 'train',
        tone: 'cyan',
        detail: 'Railway zones, operations, history and recent developments.',
      },
    ],
  },
  teaching: {
    description:
      'Build exam-ready teaching aptitude with strong pedagogy, language proficiency and subject-focused practice.',
    sections: [
      {
        title: 'Child Development',
        topics: 30,
        icon: 'brain',
        tone: 'blue',
        detail:
          'Learning theories, inclusive education and child-centred pedagogy.',
      },
      {
        title: 'Teaching Aptitude',
        topics: 24,
        icon: 'teacher',
        tone: 'mint',
        detail:
          'Classroom practice, assessment, communication and teaching methods.',
      },
      {
        title: 'Language Proficiency',
        topics: 26,
        icon: 'bookopen',
        tone: 'yellow',
        detail: 'Comprehension, grammar, vocabulary and language pedagogy.',
      },
      {
        title: 'Subject Knowledge',
        topics: 40,
        icon: 'book',
        tone: 'purple',
        detail: 'Core subject concepts and exam-pattern application questions.',
      },
      commonAwareness,
    ],
  },
  government: {
    description:
      'A structured preparation path for government recruitment exams, from core concepts to full-length timed mocks.',
    sections: [
      {
        title: 'General Intelligence',
        topics: 28,
        icon: 'brain',
        tone: 'blue',
        detail:
          'Verbal and non-verbal reasoning, analogies, series and problem solving.',
      },
      {
        title: 'Quantitative Aptitude',
        topics: 32,
        icon: 'chart',
        tone: 'mint',
        detail:
          'Arithmetic, algebra, geometry, mensuration and data interpretation.',
      },
      {
        title: 'English Language',
        topics: 28,
        icon: 'doc',
        tone: 'yellow',
        detail: 'Grammar, vocabulary, comprehension and error detection.',
      },
      commonAwareness,
      {
        title: 'State & Exam Focus',
        topics: 20,
        icon: 'india',
        tone: 'cyan',
        detail:
          'Exam-specific facts, state awareness and previous-paper themes.',
      },
    ],
  },
  entrance: {
    description:
      'Strengthen concepts, improve speed and track accuracy with topic practice and exam-pattern mock tests.',
    sections: [
      {
        title: 'Language',
        topics: 26,
        icon: 'bookopen',
        tone: 'blue',
        detail: 'Comprehension, vocabulary, grammar and verbal ability.',
      },
      {
        title: 'Quantitative Skills',
        topics: 30,
        icon: 'chart',
        tone: 'mint',
        detail: 'Numerical ability, arithmetic and data interpretation.',
      },
      {
        title: 'Logical Reasoning',
        topics: 25,
        icon: 'brain',
        tone: 'yellow',
        detail: 'Analytical thinking, patterns, series and problem solving.',
      },
      {
        title: 'Domain Knowledge',
        topics: 40,
        icon: 'gradcap',
        tone: 'purple',
        detail:
          'Subject-specific concepts aligned with the target examination.',
      },
      commonAwareness,
    ],
  },
};

const governmentExamIds = new Set([
  'exam-ssc',
  'exam-jpsc',
  'exam-bpsc',
  'exam-upsc',
  'exam-jssc',
  'exam-police',
  'exam-state',
]);

function profileFor(exam: Exam): ExamProfile {
  if (exam.id === 'exam-banking') return profiles.banking;
  if (exam.id === 'exam-railway') return profiles.railway;
  if (exam.id === 'exam-ctet' || exam.id === 'exam-teaching')
    return profiles.teaching;
  if (governmentExamIds.has(exam.id)) return profiles.government;
  return profiles.entrance;
}

function compactNumber(value?: number) {
  if (!value) return '—';
  if (value >= 100000)
    return `${(value / 100000).toFixed(value >= 1000000 ? 0 : 1)}L`;
  if (value >= 1000)
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return String(value);
}

function priceLabel(test: TestDefinition) {
  if (test.pricing === 'free') return 'FREE';
  if (!test.price) return 'PAID';
  const amount = test.price.amountMinor / 100;
  return test.price.currency === 'INR'
    ? `₹${amount}`
    : `${test.price.currency} ${amount}`;
}

function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeading}>
      <AppText weight="900" size={16} color={theme.colors.navy}>
        {title}
      </AppText>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText weight="800" size={10.5} color={theme.colors.primary}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function SyllabusRow({
  item,
  expanded,
  onPress,
}: {
  item: SyllabusSection;
  expanded: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const accent = clay[item.tone].icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${item.title}, ${item.topics} topics`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.syllabusCard,
        { backgroundColor: clay[item.tone].bg },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.syllabusTopRow}>
        <View
          style={[styles.syllabusIcon, { backgroundColor: theme.colors.white }]}
        >
          <Icon name={item.icon} size={20} color={accent} />
        </View>
        <View style={styles.syllabusCopy}>
          <AppText weight="800" size={12.5} color={colors.ink}>
            {item.title}
          </AppText>
          <AppText size={9.5} color={colors.text2} style={styles.syllabusMeta}>
            {item.topics} topics
          </AppText>
        </View>
        <View
          style={[
            styles.chevronCircle,
            { backgroundColor: theme.colors.white },
          ]}
        >
          <Icon
            name="chev"
            size={13}
            color={accent}
            style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
          />
        </View>
      </View>
      {expanded ? (
        <View style={styles.syllabusDetail}>
          <AppText size={11} color={colors.text2} style={styles.detailText}>
            {item.detail}
          </AppText>
          <View style={styles.topicPrompt}>
            <Icon name="check" size={11} color={accent} />
            <AppText weight="700" size={9.5} color={accent}>
              Included in your study plan
            </AppText>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

function TestCard({
  test,
  onPress,
}: {
  test: TestDefinition;
  onPress: () => void;
}) {
  const theme = useTheme();
  const free = test.pricing === 'free';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${test.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.testCard,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.progressTrack,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.testIcon,
          {
            backgroundColor: free ? colors.pastel.green : colors.pastel.orange,
          },
        ]}
      >
        <Icon
          name="clipboard"
          size={21}
          color={free ? colors.success : colors.orange}
        />
      </View>
      <View style={styles.testBody}>
        <View style={styles.testTitleRow}>
          <AppText
            weight="800"
            size={12}
            color={theme.colors.navy}
            numberOfLines={2}
            style={styles.testTitle}
          >
            {test.title}
          </AppText>
          <View
            style={[
              styles.miniBadge,
              { backgroundColor: free ? colors.success : colors.orange },
            ]}
          >
            <AppText weight="900" size={7.5} color="#FFFFFF">
              {priceLabel(test)}
            </AppText>
          </View>
        </View>
        <View style={styles.testMetaRow}>
          <View style={styles.inlineMeta}>
            <Icon name="doc" size={11} color={theme.colors.text3} />
            <AppText size={9.5} color={theme.colors.text2}>
              {test.questionCount} questions
            </AppText>
          </View>
          <View style={styles.inlineMeta}>
            <Icon name="clock" size={11} color={theme.colors.text3} />
            <AppText size={9.5} color={theme.colors.text2}>
              {Math.round(test.durationSeconds / 60)} min
            </AppText>
          </View>
        </View>
      </View>
      <Icon name="chev" size={14} color={theme.colors.text3} />
    </Pressable>
  );
}

function StudyPlan({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const phases = [
    ['01', 'Learn', 'Build concepts section by section'],
    ['02', 'Practise', 'Solve topic tests and review errors'],
    ['03', 'Simulate', 'Take timed mocks and improve speed'],
  ];
  return (
    <ClayCard variant="indigo" style={styles.planCard}>
      <View style={styles.planHeading}>
        <View style={styles.planTitleRow}>
          <Icon name="target" size={19} color={colors.navy} />
          <View>
            <AppText weight="900" size={14} color={colors.navy}>
              Your 3-step study plan
            </AppText>
            <AppText
              size={9.5}
              color={colors.text2}
              style={styles.planSubtitle}
            >
              Repeat weekly and track improvement
            </AppText>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityLabel="Hide study plan"
        >
          <Icon name="ellipsis" size={18} color={theme.colors.text2} />
        </Pressable>
      </View>
      <View style={styles.planSteps}>
        {phases.map(([number, title, body]) => (
          <View key={number} style={styles.planStep}>
            <View style={styles.planNumber}>
              <AppText weight="900" size={9} color={colors.primary}>
                {number}
              </AppText>
            </View>
            <View style={styles.planStepCopy}>
              <AppText weight="800" size={10.5} color={colors.navy}>
                {title}
              </AppText>
              <AppText
                size={9.5}
                color={colors.text2}
                style={styles.planStepBody}
              >
                {body}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </ClayCard>
  );
}

export function ExamDetailScreen() {
  const navigation = useNavigation<HomeNav>();
  const examId = (useRoute().params as { examId: string }).examId;
  const bookmark = useBookmark({ kind: 'exam', id: examId });
  const repos = useRepositories();
  const theme = useTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [tab, setTab] = useState<ExamTab>('syllabus');
  const [expandedSection, setExpandedSection] = useState<string>();
  const [showPlan, setShowPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const exam = useQuery({
    queryKey: queryKeys.exam(examId),
    queryFn: () => repos.catalog.exam(examId),
  });
  const tests = useQuery({
    queryKey: queryKeys.tests({ examId }),
    queryFn: () => repos.assessments.tests(examId),
  });
  const data = exam.data;
  const profile = useMemo(() => (data ? profileFor(data) : undefined), [data]);
  const freeTest = tests.data?.find(test => test.pricing === 'free');

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([exam.refetch(), tests.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };
  const pullRefresh = usePullRefreshFeedback({refreshing, onRefresh: refresh});

  const showTab = (next: ExamTab) => {
    setTab(next);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: 235, animated: true }),
    );
  };

  const openStudyPlan = () => {
    setTab('syllabus');
    setShowPlan(true);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: 235, animated: true }),
    );
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Exam Detail"
        subtitle="Competitive Exams"
        onBack={() => navigation.goBack()}
        onBookmark={bookmark}
        onShare={() => shareService.share(data?.title ?? 'Exam')}
      />
      {exam.isLoading ? <LoadingBlock /> : null}
      {exam.isError ? (
        <View style={styles.errorWrap}>
          <ErrorState
            message="Could not load this exam."
            onRetry={() => exam.refetch()}
          />
        </View>
      ) : null}
      {data && profile ? (
        <>
          <ScrollView
            {...pullRefresh.scrollProps}
            ref={scrollRef}
            contentContainerStyle={styles.page}
            showsVerticalScrollIndicator={false}
          >
            <ClayCard variant={data.clay} style={styles.hero}>
              <View style={styles.heroTop}>
                <ClayIconTile
                  icon={data.icon as IconName}
                  color={data.iconColor ?? clay[data.clay].icon}
                  size={58}
                />
                <View style={styles.heroCopy}>
                  <AppText
                    weight="900"
                    size={18}
                    color={colors.navy}
                    style={styles.heroTitle}
                  >
                    {data.title}
                  </AppText>
                  <AppText
                    size={10.5}
                    color={colors.text2}
                    numberOfLines={2}
                    style={styles.relatedText}
                  >
                    {data.relatedExams?.length
                      ? data.relatedExams.join('  ·  ')
                      : 'Focused exam preparation'}
                  </AppText>
                </View>
                <AccessBadge pricing={data.pricing} />
              </View>
              <View style={styles.heroMetrics}>
                <View style={styles.heroMetric}>
                  <Icon name="clipboard" size={14} color={colors.primary} />
                  <AppText weight="800" size={10.5} color={colors.navy}>
                    {data.testCount ?? tests.data?.length ?? '—'} tests
                  </AppText>
                </View>
                <View style={styles.heroMetric}>
                  <Icon name="users" size={14} color="#7B1FA2" />
                  <AppText weight="800" size={10.5} color={colors.navy}>
                    {compactNumber(data.learnerCount)} learners
                  </AppText>
                </View>
                <View style={styles.heroMetric}>
                  <Icon name="target" size={14} color={colors.success} />
                  <AppText weight="800" size={10.5} color={colors.navy}>
                    Guided plan
                  </AppText>
                </View>
              </View>
            </ClayCard>

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.colors.white,
                  borderColor: theme.colors.progressTrack,
                },
              ]}
            >
              <View style={styles.summaryIcon}>
                <Icon name="bulb" size={16} color={colors.orange} />
              </View>
              <AppText
                size={11.5}
                color={theme.colors.text2}
                style={styles.summaryText}
              >
                {data.description ?? profile.description}
              </AppText>
            </View>

            <View
              style={[styles.tabs, { backgroundColor: theme.colors.pressed }]}
            >
              {(
                [
                  ['syllabus', 'Syllabus'],
                  ['tests', 'Test Series'],
                  ['videos', 'Free Videos'],
                ] as const
              ).map(([key, label]) => {
                const selected = tab === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setTab(key)}
                    style={[
                      styles.tab,
                      selected && { backgroundColor: theme.colors.white },
                    ]}
                  >
                    <AppText
                      weight="800"
                      size={10.5}
                      color={
                        selected ? theme.colors.primary : theme.colors.text2
                      }
                    >
                      {label}
                    </AppText>
                    {selected ? <View style={styles.tabIndicator} /> : null}
                  </Pressable>
                );
              })}
            </View>

            {tab === 'syllabus' ? (
              <View style={styles.tabContent}>
                {showPlan ? (
                  <StudyPlan onClose={() => setShowPlan(false)} />
                ) : null}
                <SectionHeading
                  title="Syllabus"
                  action={showPlan ? undefined : 'View study plan'}
                  onAction={openStudyPlan}
                />
                <View style={styles.syllabusList}>
                  {profile.sections.map(item => (
                    <SyllabusRow
                      key={item.title}
                      item={item}
                      expanded={expandedSection === item.title}
                      onPress={() =>
                        setExpandedSection(current =>
                          current === item.title ? undefined : item.title,
                        )
                      }
                    />
                  ))}
                </View>
                <SectionHeading
                  title="Popular Tests"
                  action={
                    tests.data?.length
                      ? `All ${data.testCount ?? tests.data.length}`
                      : undefined
                  }
                  onAction={() => showTab('tests')}
                />
                {tests.isLoading ? <LoadingBlock /> : null}
                {tests.data?.slice(0, 3).map(test => (
                  <TestCard
                    key={test.id}
                    test={test}
                    onPress={() =>
                      navigation.navigate('TestInstructions', {
                        testId: test.id,
                      })
                    }
                  />
                ))}
                {!tests.isLoading && !tests.isError && !tests.data?.length ? (
                  <EmptyState
                    title="Tests are on the way"
                    body="New mock tests will appear here when they are published."
                  />
                ) : null}
              </View>
            ) : null}

            {tab === 'tests' ? (
              <View style={styles.tabContent}>
                <SectionHeading
                  title="Test Series"
                  action={
                    tests.data?.length
                      ? `${tests.data.length} available`
                      : undefined
                  }
                />
                <View
                  style={[
                    styles.tipCard,
                    { backgroundColor: colors.pastel.blue },
                  ]}
                >
                  <Icon name="clock" size={17} color={colors.primary} />
                  <View style={styles.tipCopy}>
                    <AppText weight="800" size={11} color={colors.navy}>
                      Practise under exam conditions
                    </AppText>
                    <AppText
                      size={9.5}
                      color={colors.text2}
                      style={styles.tipBody}
                    >
                      Use a quiet space, keep the timer running, then review
                      every mistake.
                    </AppText>
                  </View>
                </View>
                {tests.isLoading ? <LoadingBlock /> : null}
                {tests.isError ? (
                  <ErrorState
                    message="Could not load the test series."
                    onRetry={() => tests.refetch()}
                  />
                ) : null}
                {tests.data?.map(test => (
                  <TestCard
                    key={test.id}
                    test={test}
                    onPress={() =>
                      navigation.navigate('TestInstructions', {
                        testId: test.id,
                      })
                    }
                  />
                ))}
                {!tests.isLoading && !tests.isError && !tests.data?.length ? (
                  <EmptyState
                    title="No tests yet"
                    body="This exam track does not have a published test series yet."
                  />
                ) : null}
              </View>
            ) : null}

            {tab === 'videos' ? (
              <View style={styles.tabContent}>
                <SectionHeading title="Free Videos" />
                <ClayCard variant="sky" style={styles.videoEmpty}>
                  <View style={styles.videoIcon}>
                    <Icon name="video" size={28} color={colors.primary} />
                  </View>
                  <AppText weight="900" size={15} color={colors.navy}>
                    No video lessons published
                  </AppText>
                  <AppText
                    center
                    size={11}
                    color={colors.text2}
                    style={styles.videoBody}
                  >
                    This exam track currently has no video lessons. Use the
                    syllabus plan and published mock tests to keep studying.
                  </AppText>
                  <ClayButton
                    label="Explore mock tests"
                    compact
                    onPress={() => showTab('tests')}
                  />
                </ClayCard>
              </View>
            ) : null}
          </ScrollView>
          <StickyActionFooter>
            <View style={styles.footerActions}>
              <ClayButton
                label="Study plan"
                tone="ghost"
                icon="target"
                style={styles.planButton}
                onPress={openStudyPlan}
              />
              <ClayButton
                label={freeTest ? 'Start free mock' : 'View test series'}
                icon={freeTest ? 'play' : 'clipboard'}
                style={styles.primaryButton}
                onPress={() => {
                  if (freeTest) {
                    navigation.navigate('TestInstructions', {
                      testId: freeTest.id,
                    });
                  } else {
                    showTab('tests');
                  }
                }}
              />
            </View>
          </StickyActionFooter>
        </>
      ) : null}
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {
    paddingHorizontal: space.pageX,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 12,
  },
  errorWrap: { padding: space.pageX },
  hero: { padding: 15, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { letterSpacing: -0.25 },
  relatedText: { lineHeight: 15, marginTop: 5 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  heroMetric: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26,35,126,0.08)',
  },
  summaryCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    boxShadow: '0 8px 20px -18px rgba(26,35,126,0.7)',
  },
  summaryIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pastel.orange,
  },
  summaryText: { flex: 1, lineHeight: 18 },
  tabs: { flexDirection: 'row', borderRadius: 15, padding: 4 },
  tab: {
    flex: 1,
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  tabContent: { gap: 10 },
  sectionHeading: {
    minHeight: 28,
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  syllabusList: { gap: 9 },
  syllabusCard: {
    borderRadius: radius.card,
    padding: 11,
    boxShadow: '0 12px 22px -20px rgba(26,35,126,0.75)',
  },
  syllabusTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  syllabusIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 15px -12px rgba(26,35,126,0.7)',
  },
  syllabusCopy: { flex: 1, minWidth: 0 },
  syllabusMeta: { marginTop: 3 },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syllabusDetail: {
    marginTop: 10,
    paddingTop: 10,
    marginLeft: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(26,35,126,0.10)',
  },
  detailText: { lineHeight: 17 },
  topicPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  testCard: {
    minHeight: 78,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 10px 22px -19px rgba(26,35,126,0.8)',
  },
  testIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBody: { flex: 1, minWidth: 0 },
  testTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  testTitle: { flex: 1, minWidth: 0, lineHeight: 17 },
  miniBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  testMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 7,
  },
  inlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planCard: { padding: 13, gap: 12 },
  planHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  planTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  planSubtitle: { marginTop: 3 },
  planSteps: { gap: 8 },
  planStep: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  planNumber: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
  planStepCopy: { flex: 1 },
  planStepBody: { marginTop: 2, lineHeight: 14 },
  tipCard: {
    borderRadius: radius.card,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  tipCopy: { flex: 1 },
  tipBody: { marginTop: 3, lineHeight: 14 },
  videoEmpty: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 20,
    gap: 10,
  },
  videoIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  videoBody: { lineHeight: 17, maxWidth: 310 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  planButton: { flex: 1 },
  primaryButton: { flex: 1.35 },
  pressed: { opacity: 0.78 },
});
