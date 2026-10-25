import {createThemedStyles} from '../../theme';
import React,
  { useEffect,
  useMemo,
  useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Icon, type IconName } from '../../assets/icons';
import { DetailHeader, Screen } from '../../components/layout/Screen';
import {
  AppText,
  EmptyState,
  ErrorState,
  Gradient,
  LoadingBlock,
  ProgressBar,
  SearchInput,
} from '../../components/ui';
import { ClayButton, ClayCard } from '../../components/ui/Clay';
import { useRepositories } from '../../core/di';
import { queryKeys } from '../../core/query';
import { shareService } from '../../core/services';
import { accountKey } from '../../core/session';
import { getPreference, setPreference } from '../../core/storage';
import type { AwarenessTopic } from '../../core/types';
import { useBookmark } from '../../core/useBookmark';
import type { HomeNav } from '../../navigation/types';
import { colors, space } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import { usePullRefreshFeedback } from '../../components/ui/AppRefreshControl';

type Mode = 'learn' | 'browse' | 'quiz';
type TopicEntry = AwarenessTopic['entries'][number];

const MODES: { id: Mode; label: string; icon: IconName }[] = [
  { id: 'learn', label: 'Learn', icon: 'bookopen' },
  { id: 'browse', label: 'Browse', icon: 'search' },
  { id: 'quiz', label: 'Quick quiz', icon: 'brain' },
];

function masteryKey(topicId: string) {
  return `awareness.mastery.${accountKey()}.${topicId}`;
}

function quizOptions(entries: TopicEntry[], index: number): string[] {
  if (!entries[index]) return [];
  const answer = entries[index].value;
  const alternatives = entries
    .filter(
      (entry, entryIndex) => entryIndex !== index && entry.value !== answer,
    )
    .map(entry => entry.value);
  const unique = [...new Set(alternatives)];
  const rotated = [
    ...unique.slice(index % Math.max(unique.length, 1)),
    ...unique.slice(0, index % Math.max(unique.length, 1)),
  ];
  const options = rotated.slice(0, 3);
  options.splice(index % (options.length + 1), 0, answer);
  return options;
}

function SectionTitle({
  title,
  hint,
  action,
  onAction,
}: {
  title: string;
  hint?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleCopy}>
        <AppText weight="900" size={17} color={colors.navy}>
          {title}
        </AppText>
        {hint ? (
          <AppText size={11.5} color={colors.text2} style={styles.sectionHint}>
            {hint}
          </AppText>
        ) : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText size={11.5} weight="800" color={colors.primary}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function ModeSwitcher({
  mode,
  onChange,
  quizEnabled,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  quizEnabled: boolean;
}) {
  return (
    <View style={styles.modeBar}>
      {MODES.map(item => {
        const selected = item.id === mode;
        const disabled = item.id === 'quiz' && !quizEnabled;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.modeButton,
              selected && styles.modeButtonActive,
              disabled && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name={item.icon}
              size={15}
              color={selected ? '#FFFFFF' : colors.text2}
            />
            <AppText
              size={10.5}
              weight="800"
              color={selected ? '#FFFFFF' : colors.text2}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TopicDetailScreen() {
  const navigation = useNavigation<HomeNav>();
  const topicId = (useRoute().params as { topicId: string }).topicId;
  const bookmark = useBookmark({ kind: 'topic', id: topicId });
  const repos = useRepositories();
  const theme = useTheme();
  const cardTones = [
    theme.colors.pastel.blue,
    theme.colors.pastel.green,
    theme.colors.pastel.orange,
    theme.colors.pastel.purple,
  ];
  const [mode, setMode] = useState<Mode>('learn');
  const [studyIndex, setStudyIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [openEntries, setOpenEntries] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string>();
  const [quizScore, setQuizScore] = useState(0);

  const topic = useQuery({
    queryKey: queryKeys.topic(topicId),
    queryFn: () => repos.content.topic(topicId),
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: topic.isRefetching,
    onRefresh: () => {
      topic.refetch().catch(() => undefined);
    },
  });
  const data = topic.data;
  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);

  useEffect(() => {
    let active = true;
    setMasteredIds([]);
    getPreference<string[]>(masteryKey(topicId), []).then(saved => {
      if (active) setMasteredIds(Array.isArray(saved) ? saved : []);
    });
    return () => {
      active = false;
    };
  }, [topicId]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(
      entry =>
        entry.label.toLowerCase().includes(query) ||
        entry.value.toLowerCase().includes(query),
    );
  }, [entries, search]);

  const activeEntry = entries[studyIndex];
  const masteryPercent = entries.length
    ? Math.round(
        (masteredIds.filter(id => entries.some(entry => entry.id === id))
          .length /
          entries.length) *
          100,
      )
    : 0;
  const quizEntry = entries[quizIndex];
  const options = useMemo(
    () => quizOptions(entries, quizIndex),
    [entries, quizIndex],
  );
  const quizFinished =
    entries.length > 0 && quizIndex >= Math.min(entries.length, 5);

  const updateMastery = (entryId: string, mastered: boolean) => {
    setMasteredIds(current => {
      const next = mastered
        ? [...new Set([...current, entryId])]
        : current.filter(id => id !== entryId);
      setPreference(masteryKey(topicId), next);
      return next;
    });
  };

  const moveStudyCard = (direction: -1 | 1) => {
    setStudyIndex(current =>
      Math.max(0, Math.min(entries.length - 1, current + direction)),
    );
    setRevealed(false);
  };

  const markAndContinue = () => {
    if (!activeEntry) return;
    updateMastery(activeEntry.id, true);
    if (studyIndex < entries.length - 1) moveStudyCard(1);
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    if (next === 'quiz') {
      setQuizIndex(0);
      setQuizSelected(undefined);
      setQuizScore(0);
    }
  };

  const answerQuiz = (answer: string) => {
    if (quizSelected || !quizEntry) return;
    setQuizSelected(answer);
    if (answer === quizEntry.value) setQuizScore(current => current + 1);
  };

  const nextQuestion = () => {
    setQuizIndex(current => current + 1);
    setQuizSelected(undefined);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizSelected(undefined);
    setQuizScore(0);
  };

  const shareTopic = () => {
    const title = data?.title ?? 'General awareness topic';
    const detail = entries.length
      ? `Study ${entries.length} key facts`
      : 'Explore this topic';
    shareService.share(`${title} on RACI\n${detail}.`);
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Topic guide"
        subtitle={data?.title}
        onBack={() => navigation.goBack()}
        onBookmark={bookmark}
        onShare={shareTopic}
      />
      {topic.isLoading ? <LoadingBlock /> : null}
      {topic.isError ? (
        <ErrorState
          message="Topic unavailable."
          onRetry={() => topic.refetch()}
        />
      ) : null}
      {data ? (
        <ScrollView
          {...pullRefresh.scrollProps}
          style={{ backgroundColor: 'transparent' }}
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Gradient
            colors={['#111E4F', '#174EA6', '#1995D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Icon name={data.icon as IconName} size={27} color="#FFFFFF" />
              </View>
              <View style={styles.heroLabel}>
                <Icon name="zap" size={12} color="#FDE68A" filled />
                <AppText
                  size={9.5}
                  weight="900"
                  color="#E0F2FE"
                  style={styles.eyebrow}
                >
                  SMART STUDY GUIDE
                </AppText>
              </View>
            </View>
            <AppText
              size={25}
              weight="900"
              color="#FFFFFF"
              style={styles.heroTitle}
            >
              {data.title}
            </AppText>
            <AppText
              size={12}
              color="rgba(255,255,255,0.78)"
              style={styles.heroBody}
            >
              {entries.length
                ? `${entries.length} essential facts, organised for fast revision and recall.`
                : 'A focused guide for quick, confident revision.'}
            </AppText>
            {data.summaryChips?.length ? (
              <View style={styles.summaryRow}>
                {data.summaryChips.map(chip => (
                  <View key={chip} style={styles.summaryChip}>
                    <AppText size={9.5} weight="800" color="#FFFFFF">
                      {chip}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
            {entries.length ? (
              <View style={styles.heroProgress}>
                <View style={styles.progressCopy}>
                  <AppText size={10.5} weight="800" color="#FFFFFF">
                    Your recall progress
                  </AppText>
                  <AppText size={10.5} weight="900" color="#BAE6FD">
                    {masteryPercent}%
                  </AppText>
                </View>
                <ProgressBar percent={masteryPercent} height={6} />
              </View>
            ) : null}
          </Gradient>

          {data.access.state !== 'granted' ? (
            <EmptyState
              title="This guide is locked"
              body="Your current plan does not include this topic yet."
            />
          ) : entries.length === 0 ? (
            <EmptyState
              title="No study cards published"
              body="This topic is not ready for learning yet. Choose another published topic from General Awareness."
            />
          ) : (
            <>
              <ModeSwitcher
                mode={mode}
                onChange={changeMode}
                quizEnabled={entries.length > 1}
              />

              {mode === 'learn' && activeEntry ? (
                <View style={styles.modeContent}>
                  <SectionTitle
                    title="Focus cards"
                    hint="Recall the answer before you reveal it."
                    action={masteryPercent === 100 ? 'Completed' : undefined}
                  />
                  <ClayCard
                    variant="white"
                    padded={false}
                    style={styles.studyCard}
                  >
                    <View
                      style={[
                        styles.studyAccent,
                        {
                          backgroundColor:
                            activeEntry.iconColor ?? colors.primary,
                        },
                      ]}
                    />
                    <View style={styles.studyCardInner}>
                      <View style={styles.cardMetaRow}>
                        <View style={styles.countPill}>
                          <AppText
                            size={10}
                            weight="900"
                            color={colors.primary}
                          >
                            {studyIndex + 1} / {entries.length}
                          </AppText>
                        </View>
                        {masteredIds.includes(activeEntry.id) ? (
                          <View style={styles.masteredPill}>
                            <Icon
                              name="check"
                              size={12}
                              color={colors.success}
                            />
                            <AppText
                              size={9.5}
                              weight="900"
                              color={colors.success}
                            >
                              LEARNED
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                      <AppText
                        size={10}
                        weight="900"
                        color={colors.text2}
                        style={styles.promptLabel}
                      >
                        WHAT MATCHES THIS?
                      </AppText>
                      <AppText
                        size={24}
                        weight="900"
                        color={colors.navy}
                        center
                        style={styles.question}
                      >
                        {activeEntry.label}
                      </AppText>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          revealed
                            ? `Answer: ${activeEntry.value}`
                            : 'Reveal answer'
                        }
                        onPress={() => setRevealed(true)}
                        style={[
                          styles.answerSurface,
                          revealed && styles.answerSurfaceRevealed,
                        ]}
                      >
                        {revealed ? (
                          <>
                            <AppText
                              size={10}
                              weight="900"
                              color={colors.success}
                              style={styles.answerLabel}
                            >
                              ANSWER
                            </AppText>
                            <AppText
                              size={20}
                              weight="900"
                              color={colors.navy}
                              center
                            >
                              {activeEntry.value}
                            </AppText>
                          </>
                        ) : (
                          <View style={styles.revealRow}>
                            <Icon name="eye" size={17} color={colors.primary} />
                            <AppText
                              size={12.5}
                              weight="800"
                              color={colors.primary}
                            >
                              Tap to reveal answer
                            </AppText>
                          </View>
                        )}
                      </Pressable>
                      {revealed ? (
                        <View style={styles.studyActions}>
                          <ClayButton
                            label="Practice again"
                            tone="ghost"
                            compact
                            style={styles.flexButton}
                            onPress={() => updateMastery(activeEntry.id, false)}
                          />
                          <ClayButton
                            label={
                              studyIndex === entries.length - 1
                                ? 'Got it'
                                : 'Got it · Next'
                            }
                            tone="success"
                            compact
                            icon="check"
                            style={styles.flexButton}
                            onPress={markAndContinue}
                          />
                        </View>
                      ) : (
                        <ClayButton
                          label="Reveal answer"
                          icon="eye"
                          onPress={() => setRevealed(true)}
                        />
                      )}
                    </View>
                  </ClayCard>
                  <View style={styles.cardNavigation}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous card"
                      disabled={studyIndex === 0}
                      onPress={() => moveStudyCard(-1)}
                      style={[
                        styles.navButton,
                        studyIndex === 0 && styles.disabled,
                      ]}
                    >
                      <Icon name="back" size={16} color={colors.navy} />
                      <AppText size={11.5} weight="800" color={colors.navy}>
                        Previous
                      </AppText>
                    </Pressable>
                    <View style={styles.dotRow}>
                      {entries.slice(0, 7).map((entry, index) => (
                        <View
                          key={entry.id}
                          style={[
                            styles.stepDot,
                            index === studyIndex && styles.stepDotActive,
                            masteredIds.includes(entry.id) &&
                              styles.stepDotDone,
                          ]}
                        />
                      ))}
                      {entries.length > 7 ? (
                        <AppText size={10} weight="800" color={colors.text2}>
                          +{entries.length - 7}
                        </AppText>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next card"
                      disabled={studyIndex === entries.length - 1}
                      onPress={() => moveStudyCard(1)}
                      style={[
                        styles.navButton,
                        studyIndex === entries.length - 1 && styles.disabled,
                      ]}
                    >
                      <AppText size={11.5} weight="800" color={colors.navy}>
                        Next
                      </AppText>
                      <Icon name="chev" size={16} color={colors.navy} />
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {mode === 'browse' ? (
                <View style={styles.modeContent}>
                  <SectionTitle
                    title="All key facts"
                    hint={`${filteredEntries.length} ${
                      filteredEntries.length === 1 ? 'match' : 'matches'
                    } in this guide`}
                    action={showAll ? 'Hide answers' : 'Reveal all'}
                    onAction={() => setShowAll(current => !current)}
                  />
                  <SearchInput
                    placeholder="Search names or answers"
                    value={search}
                    onChangeText={setSearch}
                    onClear={() => setSearch('')}
                  />
                  <View style={styles.entryList}>
                    {filteredEntries.map((entry, index) => {
                      const isOpen = showAll || openEntries.includes(entry.id);
                      return (
                        <ClayCard
                          key={entry.id}
                          variant="white"
                          padded={false}
                          onPress={() =>
                            setOpenEntries(current =>
                              current.includes(entry.id)
                                ? current.filter(id => id !== entry.id)
                                : [...current, entry.id],
                            )
                          }
                          style={styles.entryCard}
                        >
                          <View
                            style={[
                              styles.entryIcon,
                              {
                                backgroundColor:
                                  cardTones[index % cardTones.length],
                              },
                            ]}
                          >
                            <AppText
                              size={13}
                              weight="900"
                              color={entry.iconColor ?? colors.primary}
                            >
                              {entry.group ?? entry.label.charAt(0)}
                            </AppText>
                          </View>
                          <View style={styles.entryCopy}>
                            <AppText size={13} weight="800" color={colors.navy}>
                              {entry.label}
                            </AppText>
                            <AppText
                              size={11}
                              weight={isOpen ? '800' : '600'}
                              color={isOpen ? colors.success : colors.text2}
                              style={styles.entryValue}
                            >
                              {isOpen ? entry.value : 'Tap to reveal'}
                            </AppText>
                          </View>
                          <Icon
                            name={isOpen ? 'eye' : 'chev'}
                            size={16}
                            color={isOpen ? colors.success : colors.text2}
                          />
                        </ClayCard>
                      );
                    })}
                  </View>
                  {!filteredEntries.length ? (
                    <EmptyState
                      title="No matching facts"
                      body="Try a different name or answer."
                      actionLabel="Clear search"
                      onAction={() => setSearch('')}
                    />
                  ) : null}
                </View>
              ) : null}

              {mode === 'quiz' ? (
                <View style={styles.modeContent}>
                  <SectionTitle
                    title="Quick recall"
                    hint="Five questions. No pressure—just practice."
                  />
                  {quizFinished ? (
                    <ClayCard
                      variant={
                        quizScore >=
                        Math.ceil(Math.min(entries.length, 5) * 0.7)
                          ? 'green'
                          : 'blue'
                      }
                      style={styles.resultCard}
                    >
                      <View style={styles.resultIcon}>
                        <Icon
                          name={
                            quizScore >=
                            Math.ceil(Math.min(entries.length, 5) * 0.7)
                              ? 'trophy'
                              : 'refresh'
                          }
                          size={30}
                          color={
                            quizScore >=
                            Math.ceil(Math.min(entries.length, 5) * 0.7)
                              ? colors.success
                              : colors.primary
                          }
                        />
                      </View>
                      <AppText
                        size={21}
                        weight="900"
                        color={colors.navy}
                        center
                      >
                        {quizScore} / {Math.min(entries.length, 5)} correct
                      </AppText>
                      <AppText
                        size={12}
                        color={colors.text2}
                        center
                        style={styles.resultBody}
                      >
                        {quizScore >=
                        Math.ceil(Math.min(entries.length, 5) * 0.7)
                          ? 'Strong recall. Mark any tricky cards for another pass.'
                          : 'A quick review of the focus cards will lock these in.'}
                      </AppText>
                      <View style={styles.resultActions}>
                        <ClayButton
                          label="Review cards"
                          tone="ghost"
                          compact
                          style={styles.flexButton}
                          onPress={() => changeMode('learn')}
                        />
                        <ClayButton
                          label="Try again"
                          compact
                          icon="refresh"
                          style={styles.flexButton}
                          onPress={resetQuiz}
                        />
                      </View>
                    </ClayCard>
                  ) : quizEntry ? (
                    <ClayCard variant="white" style={styles.quizCard}>
                      <View style={styles.quizTopline}>
                        <AppText size={10} weight="900" color={colors.primary}>
                          QUESTION {quizIndex + 1} OF{' '}
                          {Math.min(entries.length, 5)}
                        </AppText>
                        <AppText size={10.5} weight="800" color={colors.text2}>
                          Score {quizScore}
                        </AppText>
                      </View>
                      <ProgressBar
                        percent={
                          (quizIndex / Math.min(entries.length, 5)) * 100
                        }
                        height={5}
                      />
                      <AppText
                        size={11}
                        weight="800"
                        color={colors.text2}
                        center
                      >
                        Choose the correct match for
                      </AppText>
                      <AppText
                        size={22}
                        weight="900"
                        color={colors.navy}
                        center
                        style={styles.quizQuestion}
                      >
                        {quizEntry.label}
                      </AppText>
                      <View style={styles.optionList}>
                        {options.map(option => {
                          const chosen = quizSelected === option;
                          const correct =
                            quizSelected && option === quizEntry.value;
                          const wrong = chosen && option !== quizEntry.value;
                          return (
                            <Pressable
                              key={option}
                              accessibilityRole="radio"
                              accessibilityState={{
                                selected: chosen,
                                disabled: Boolean(quizSelected),
                              }}
                              disabled={Boolean(quizSelected)}
                              onPress={() => answerQuiz(option)}
                              style={[
                                styles.option,
                                correct && styles.optionCorrect,
                                wrong && styles.optionWrong,
                              ]}
                            >
                              <View
                                style={[
                                  styles.optionRadio,
                                  chosen && styles.optionRadioSelected,
                                  correct && styles.optionRadioCorrect,
                                ]}
                              >
                                {correct ? (
                                  <Icon
                                    name="check"
                                    size={12}
                                    color="#FFFFFF"
                                  />
                                ) : null}
                              </View>
                              <AppText
                                size={12.5}
                                weight="800"
                                color={colors.navy}
                                style={styles.optionText}
                              >
                                {option}
                              </AppText>
                            </Pressable>
                          );
                        })}
                      </View>
                      {quizSelected ? (
                        <View
                          style={[
                            styles.feedback,
                            quizSelected === quizEntry.value
                              ? styles.feedbackCorrect
                              : styles.feedbackWrong,
                          ]}
                        >
                          <Icon
                            name={
                              quizSelected === quizEntry.value
                                ? 'check'
                                : 'bulb'
                            }
                            size={17}
                            color={
                              quizSelected === quizEntry.value
                                ? colors.success
                                : '#B45309'
                            }
                          />
                          <AppText
                            size={11.5}
                            weight="800"
                            color={
                              quizSelected === quizEntry.value
                                ? colors.success
                                : '#92400E'
                            }
                            style={styles.feedbackText}
                          >
                            {quizSelected === quizEntry.value
                              ? 'Correct—nice recall.'
                              : `The answer is ${quizEntry.value}.`}
                          </AppText>
                        </View>
                      ) : null}
                      <ClayButton
                        label={
                          quizIndex + 1 >= Math.min(entries.length, 5)
                            ? 'See my result'
                            : 'Next question'
                        }
                        disabled={!quizSelected}
                        onPress={nextQuestion}
                        icon="chev"
                      />
                    </ClayCard>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = createThemedStyles({
  page: { padding: space.pageX, gap: 16, paddingBottom: 34 },
  hero: { minHeight: 264, borderRadius: 26, padding: 18, overflow: 'hidden' },
  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -62,
    top: -70,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(56,189,248,0.16)',
    left: -55,
    bottom: -68,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6,24,66,0.32)',
    borderRadius: 999,
    paddingHorizontal: 10,
    minHeight: 29,
  },
  eyebrow: { letterSpacing: 0.75 },
  heroTitle: { marginTop: 18, lineHeight: 31 },
  heroBody: { marginTop: 7, maxWidth: 340, lineHeight: 18 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  summaryChip: {
    minHeight: 27,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroProgress: { marginTop: 16, gap: 7 },
  progressCopy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: '#E8EDF5',
    padding: 4,
    borderRadius: 16,
    gap: 3,
  },
  modeButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    boxShadow: '0 8px 14px -8px rgba(25,118,210,0.7)',
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.35 },
  modeContent: { gap: 13 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitleCopy: { flex: 1, minWidth: 0 },
  sectionHint: { marginTop: 4, lineHeight: 16 },
  studyCard: { overflow: 'hidden' },
  studyAccent: { height: 5 },
  studyCardInner: { padding: 16, gap: 14 },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countPill: {
    backgroundColor: colors.pastel.blue,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  masteredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.pastel.green,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  promptLabel: { textAlign: 'center', letterSpacing: 0.7, marginTop: 5 },
  question: { lineHeight: 31, minHeight: 48 },
  answerSurface: {
    minHeight: 92,
    borderRadius: 17,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#90CAF9',
    backgroundColor: '#F5FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  answerSurfaceRevealed: {
    borderStyle: 'solid',
    borderColor: '#A5D6A7',
    backgroundColor: '#F1F8F2',
  },
  answerLabel: { letterSpacing: 0.8, marginBottom: 7 },
  revealRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  studyActions: { flexDirection: 'row', gap: 9 },
  flexButton: { flex: 1 },
  cardNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
  },
  dotRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  stepDotActive: { width: 17, backgroundColor: colors.primary },
  stepDotDone: { backgroundColor: colors.successAccent },
  entryList: { gap: 9 },
  entryCard: {
    minHeight: 68,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  entryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCopy: { flex: 1, minWidth: 0 },
  entryValue: { marginTop: 5 },
  resultCard: { alignItems: 'center', padding: 20, gap: 11 },
  resultIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: { lineHeight: 18, maxWidth: 290 },
  resultActions: { width: '100%', flexDirection: 'row', gap: 9, marginTop: 4 },
  quizCard: { padding: 15, gap: 14 },
  quizTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizQuestion: { lineHeight: 29, marginTop: -5 },
  optionList: { gap: 9 },
  option: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DCE4EF',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionCorrect: { borderColor: '#81C784', backgroundColor: '#E8F5E9' },
  optionWrong: { borderColor: '#EF9A9A', backgroundColor: '#FFEBEE' },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: { borderColor: colors.error },
  optionRadioCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  optionText: { flex: 1 },
  feedback: {
    borderRadius: 13,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackCorrect: { backgroundColor: colors.pastel.green },
  feedbackWrong: { backgroundColor: '#FEF3C7' },
  feedbackText: { flex: 1, lineHeight: 16 },
});
