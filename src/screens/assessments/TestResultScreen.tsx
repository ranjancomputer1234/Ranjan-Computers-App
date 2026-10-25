import React from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {colors, clay, gradients} from '../../theme';
import type {ClayVariant} from '../../theme';
import {AppText, EmptyState, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {shareService} from '../../core/services';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {LearningStackParamList} from '../../navigation/types';
import type {ResultQuestion, ResultSection} from '../../core/types';
import {useTestResult} from '../../features/assessments/hooks/useTestResult';
import {styles} from './styles';

const RING_R = 57;
const RING_C = 2 * Math.PI * RING_R;

const SECTION_TONES: {variant: ClayVariant; score: string; fill: readonly [string, string]}[] = [
  {variant: 'mint', score: '#2E7D32', fill: ['#80CBC4', '#00897B']},
  {variant: 'yellow', score: '#F57C00', fill: ['#FFE082', '#F57C00']},
  {variant: 'blue', score: '#1565C0', fill: ['#64B5F6', '#1976D2']},
  {variant: 'purple', score: '#7B1FA2', fill: ['#CE93D8', '#7B1FA2']},
];

export function TestResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LearningStackParamList>>();
  const attemptId = (useRoute().params as {attemptId: string}).attemptId;
  const {
    result,
    data,
    testTitle,
    setFilter,
    sectionFilter,
    setSectionFilter,
    questions,
    counts,
    weakest,
    strongest,
    rankLabel,
    timeLabel,
    accuracy,
  } = useTestResult(attemptId);
  const [showDetails, setShowDetails] = React.useState(false);
  const [solutionsOpen, setSolutionsOpen] = React.useState(false);
  const [openQuestion, setOpenQuestion] = React.useState<string | null>(null);
  const title = testTitle ?? 'Test Result';

  const shareScore = () => {
    if (!data) return;
    shareService
      .share(
        `I scored ${data.percent}% (${data.score}/${data.maxScore}) on ${title} at RACI.${rankLabel ? ` ${rankLabel}.` : ''}`,
      )
      .catch(() => undefined);
  };

  if (result.isLoading) {
    return (
      <Screen padded={false}>
        <DetailHeader title="Test Result" onBack={() => navigation.goBack()} />
        <LoadingBlock />
      </Screen>
    );
  }

  if (result.isError) {
    return (
      <Screen padded={false}>
        <DetailHeader title="Test Result" onBack={() => navigation.goBack()} />
        <ErrorState message="This result could not be loaded." onRetry={() => result.refetch()} />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen padded={false}>
        <DetailHeader title="Test Result" onBack={() => navigation.goBack()} />
        <EmptyState title="Result unavailable" body="This attempt has no scored result yet." />
      </Screen>
    );
  }

  const pct = Math.max(0, Math.min(100, data.percent));
  const retry = () => {
    Alert.alert(
      'Retry this test?',
      'A new attempt will start. This result will stay in your history.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Retry Test', onPress: () => navigation.navigate('TestInstructions', {testId: data.testId})},
      ],
    );
  };
  const viewSolutions = () => {
    if (!data.solutionsAvailable) {
      Alert.alert('Solutions locked', 'Solutions unlock after the test window closes. Check back once they are released.');
      return;
    }
    setSolutionsOpen(open => !open);
    setOpenQuestion(null);
  };

  return (
    <Screen padded={false}>
      <DetailHeader title="Test Result" subtitle={title} onBack={() => navigation.goBack()} onShare={shareScore} />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ClayCard variant="green" padded={false} style={styles.scoreCard}>
          <ScoreRing percent={pct} score={data.score} maxScore={data.maxScore} />
          <View style={styles.metaRow}>
            {rankLabel ? <TypeChip label={rankLabel} tone="fact" /> : null}
            {accuracy != null ? <TypeChip label={`Accuracy ${Math.round(accuracy)}%`} tone="course" /> : null}
            {timeLabel ? <TypeChip label={`Time ${timeLabel}`} tone="news" /> : null}
          </View>
        </ClayCard>

        {data.sections?.length ? (
          <>
            <View style={styles.sectionHead}>
              <AppText weight="800" size={16.5} color={colors.navy} style={styles.sectionTitle}>
                Section Analysis
              </AppText>
              <Pressable
                onPress={() => setShowDetails(open => !open)}
                accessibilityRole="button"
                accessibilityLabel={showDetails ? 'Hide section details' : 'Show section details'}
                hitSlop={8}
                style={styles.seeAll}>
                <AppText weight="700" size={11.5} color={colors.primary}>
                  {showDetails ? 'Hide' : 'Details'}
                </AppText>
              </Pressable>
            </View>
            <View style={styles.sectionGrid}>
              {data.sections.map((section, index) => (
                <SectionCard
                  key={section.name}
                  section={section}
                  tone={SECTION_TONES[index % SECTION_TONES.length]}
                  selected={sectionFilter === section.name}
                  onPress={() => {
                    setSectionFilter(current => (current === section.name ? undefined : section.name));
                    setFilter('All');
                  }}
                />
              ))}
            </View>
            {showDetails && (weakest || strongest) ? (
              <ClayCard variant="sky" padded={false} style={styles.insight}>
                <AppText size={11} color={colors.text2} style={styles.insightText}>
                  {strongest ? `Strongest: ${strongest.name} (${strongest.score}/${strongest.max}). ` : ''}
                  {weakest && weakest.name !== strongest?.name
                    ? `Focus next on ${weakest.name} — ${weakest.score}/${weakest.max}. Tap a section to review those questions.`
                    : 'Tap a section to review its questions.'}
                </AppText>
              </ClayCard>
            ) : null}
          </>
        ) : null}

        <View style={styles.sectionHead}>
          <AppText weight="800" size={16.5} color={colors.navy} style={styles.sectionTitle}>
            Question Review
          </AppText>
          <Pressable
            onPress={() => {
              setFilter('All');
              setSectionFilter(undefined);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Show all ${counts.all} questions`}
            hitSlop={8}
            style={styles.seeAll}>
            <AppText weight="700" size={11.5} color={colors.primary}>
              All {counts.all}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.reviewList}>
          {questions.length ? (
            questions.map((question, index) => (
              <QuestionRow
                key={question.id}
                index={data.questions.findIndex(item => item.id === question.id) + 1 || index + 1}
                question={question}
                expanded={solutionsOpen || openQuestion === question.id}
                canReveal={data.solutionsAvailable}
                onPress={() => {
                  if (!data.solutionsAvailable) {
                    Alert.alert('Solutions locked', 'Solutions unlock after the test window closes.');
                    return;
                  }
                  if (solutionsOpen) return;
                  setOpenQuestion(current => (current === question.id ? null : question.id));
                }}
              />
            ))
          ) : (
            <View style={styles.emptyReview}>
              <AppText size={11.5} color={colors.text2} center>
                No questions in this section.
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.dual}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={solutionsOpen ? 'Hide solutions' : 'View solutions'}
            onPress={viewSolutions}
            style={({pressed}) => [styles.btnOut, styles.dualBtn, pressed && styles.pressed]}>
            <AppText weight="800" size={12} color={colors.primary}>
              {solutionsOpen ? 'Hide Solutions' : 'View Solutions'}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry test"
            onPress={retry}
            style={({pressed}) => [styles.dualBtn, pressed && styles.pressed]}>
            <Gradient colors={gradients.primaryButton} style={styles.btnSolid}>
              <AppText weight="800" size={12} color="#fff">
                Retry Test
              </AppText>
            </Gradient>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ScoreRing({percent, score, maxScore}: {percent: number; score: number; maxScore: number}) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '') || 'ring';
  const offset = RING_C * (1 - percent / 100);
  return (
    <View
      style={styles.scoreRing}
      accessibilityRole="progressbar"
      accessibilityValue={{min: 0, max: 100, now: Math.round(percent)}}
      accessibilityLabel={`${Math.round(percent)} percent score, ${score} out of ${maxScore}`}>
      <Svg width={132} height={132} style={styles.scoreRingSvg}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#66BB6A" />
            <Stop offset="1" stopColor="#2E7D32" />
          </LinearGradient>
        </Defs>
        <Circle cx={66} cy={66} r={RING_R} fill="none" stroke="#C8E6C9" strokeWidth={13} />
        <Circle
          cx={66}
          cy={66}
          r={RING_R}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${RING_C}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View pointerEvents="none" style={styles.scoreInner}>
        <AppText weight="900" size={26} color={colors.navy} style={styles.scoreValue}>
          {score}/{maxScore}
        </AppText>
        <AppText weight="600" size={9} face="mono" color={colors.text2} style={styles.scorePct}>
          {Math.round(percent)}% SCORE
        </AppText>
      </View>
    </View>
  );
}

function TypeChip({label, tone}: {label: string; tone: 'fact' | 'course' | 'news' | 'live' | 'muted'}) {
  const palette = {
    fact: {wrap: styles.chipFact, color: '#2E7D32'},
    course: {wrap: styles.chipCourse, color: '#1565C0'},
    news: {wrap: styles.chipNews, color: '#EF6C00'},
    live: {wrap: styles.chipLive, color: '#C62828'},
    muted: {wrap: styles.chipMuted, color: colors.text2},
  }[tone];
  return (
    <View style={[styles.typeChip, palette.wrap]}>
      <AppText weight="800" size={8.5} color={palette.color} style={styles.typeChipText}>
        {label}
      </AppText>
    </View>
  );
}

function SectionCard({
  section,
  tone,
  selected,
  onPress,
}: {
  section: ResultSection;
  tone: (typeof SECTION_TONES)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const pct = section.max > 0 ? Math.max(0, Math.min(100, (section.score / section.max) * 100)) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      accessibilityLabel={`${section.name} ${section.score} of ${section.max}`}
      onPress={onPress}
      style={({pressed}) => [
        styles.secCard,
        {backgroundColor: clay[tone.variant].bg},
        selected && styles.secCardOn,
        pressed && styles.pressed,
      ]}>
      <View style={styles.secTop}>
        <AppText weight="800" size={11} color={colors.navy} numberOfLines={1} style={styles.sectionName}>
          {section.name}
        </AppText>
        <AppText weight="800" size={11} color={tone.score}>
          {section.score}/{section.max}
        </AppText>
      </View>
      <View
        style={styles.pbar}
        accessibilityRole="progressbar"
        accessibilityValue={{min: 0, max: 100, now: Math.round(pct)}}>
        <Gradient colors={tone.fill} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.pfill, {width: `${pct}%`}]} />
      </View>
    </Pressable>
  );
}

function QuestionRow({
  index,
  question,
  expanded,
  canReveal,
  onPress,
}: {
  index: number;
  question: ResultQuestion;
  expanded: boolean;
  canReveal: boolean;
  onPress: () => void;
}) {
  const skipped = question.status === 'skipped';
  const wrong = question.status === 'wrong';
  const numStyle = skipped
    ? {backgroundColor: colors.pressed, color: colors.text2}
    : wrong
      ? {backgroundColor: colors.pastel.red, color: colors.error}
      : {backgroundColor: colors.pastel.green, color: colors.success};
  const chip = skipped
    ? {label: 'SKIPPED', tone: 'muted' as const}
    : wrong
      ? {label: 'WRONG', tone: 'live' as const}
      : {label: 'CORRECT', tone: 'fact' as const};
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Question ${String(index).padStart(2, '0')}, ${chip.label}`}
      accessibilityHint={canReveal ? 'Opens the answer and explanation' : 'Solutions are locked'}
      accessibilityState={{expanded: canReveal ? expanded : undefined}}
      onPress={onPress}
      style={({pressed}) => [styles.solRow, pressed && styles.pressed]}>
      <View style={styles.solMain}>
        <View style={[styles.solNum, {backgroundColor: numStyle.backgroundColor}]}>
          <AppText weight="800" size={10} color={numStyle.color}>
            {String(index).padStart(2, '0')}
          </AppText>
        </View>
        <AppText
          weight="700"
          size={10.5}
          color={skipped ? colors.text2 : colors.ink}
          numberOfLines={expanded ? 4 : 2}
          style={styles.solPrompt}>
          {question.prompt}
        </AppText>
        <TypeChip label={chip.label} tone={chip.tone} />
      </View>
      {expanded && canReveal ? (
        <View style={styles.solutionBox}>
          <AppText size={10.5} color={colors.text2} style={styles.solutionLine}>
            Your answer: {question.selectedLabel ?? (skipped ? 'Not attempted' : 'Saved choice')}
          </AppText>
          {question.correctLabel ? (
            <AppText size={10.5} color={colors.success} weight="700" style={styles.solutionLine}>
              Correct: {question.correctLabel}
            </AppText>
          ) : null}
          {question.explanation ? (
            <AppText size={10.5} color={colors.text2} style={styles.solutionLine}>
              {question.explanation}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
