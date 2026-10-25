import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {Icon} from '../../assets/icons';
import {DetailHeader, Screen, StickyActionFooter} from '../../components/layout/Screen';
import {AppText, ClayButton, ProgressBar} from '../../components/ui';
import type {Question} from '../../core/types';
import {colors, radius, space, type AppColors} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';

type Feedback = 'correct' | 'incorrect' | null;

type Props = {
  question: Question;
  index: number;
  total: number;
  answer?: string;
  answeredCount: number;
  feedback: Feedback;
  remaining: number | null;
  busy: boolean;
  error: string;
  onBack: () => void;
  onSelect: (optionId: string) => void;
  onAdvance: () => void;
  onSkip: () => void;
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function DailyQuizExperience({
  question,
  index,
  total,
  answer,
  answeredCount,
  feedback,
  remaining,
  busy,
  error,
  onBack,
  onSelect,
  onAdvance,
  onSkip,
}: Props) {
  const theme = useTheme();
  const [hintOpen, setHintOpen] = React.useState(false);
  const finalQuestion = index === total - 1;
  const progress = total ? ((index + 1) / total) * 100 : 0;
  const correctOption = question.options.find(option => option.id === question.correctOptionId);
  const canRevealAnswer = Boolean(question.revealAnswer && question.correctOptionId);

  React.useEffect(() => setHintOpen(false), [question.id]);

  const primaryLabel = busy
    ? 'Saving…'
    : remaining === 0
      ? 'Submit saved answers'
      : !feedback
        ? canRevealAnswer
          ? 'Check answer'
          : finalQuestion
            ? 'Finish quiz'
            : 'Next question'
        : finalQuestion
          ? 'Finish quiz'
          : 'Next question';

  return (
    <Screen padded={false}>
      <DetailHeader
        title="Daily Challenge"
        subtitle="A little progress, every day"
        onBack={onBack}
        right={
          remaining !== null ? (
            <View
              style={[styles.timer, remaining <= 30 && styles.timerUrgent]}
              accessibilityLabel={`Time remaining ${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds`}>
              <Icon name="clock" size={14} color={remaining <= 30 ? colors.error : colors.primary} />
              <AppText face="mono" weight="800" size={11} color={remaining <= 30 ? colors.error : colors.navy}>
                {formatTime(remaining)}
              </AppText>
            </View>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <View style={styles.eyebrowRow}>
              <View style={styles.dailyPill}>
                <Icon name="zap" size={11} color="#B45309" />
                <AppText weight="900" size={9} color="#92400E" style={styles.eyebrow}>
                  TODAY'S QUIZ
                </AppText>
              </View>
              <AppText size={10.5} weight="700" color={theme.colors.text2}>
                {answeredCount} answered
              </AppText>
            </View>
            <View style={styles.questionMeta}>
              <AppText weight="900" size={20} color={theme.colors.navy}>
                Question {index + 1}
              </AppText>
              <AppText face="mono" weight="700" size={11} color={theme.colors.text2}>
                {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </AppText>
            </View>
          </View>
          <ProgressBar percent={progress} height={7} />
        </View>

        <View style={[styles.questionCard, {backgroundColor: theme.colors.white}]}>
          <View style={styles.questionTop}>
            <View style={styles.categoryIcon}>
              <Icon name={question.category === 'Computer' ? 'cpu' : 'brain'} size={18} color={colors.primary} />
            </View>
            <View style={styles.categoryText}>
              <AppText weight="800" size={10} color={colors.primary} style={styles.categoryLabel}>
                {(question.category ?? 'DAILY PRACTICE').toUpperCase()}
              </AppText>
              <AppText size={10} color={theme.colors.text3}>
                Choose one answer
              </AppText>
            </View>
          </View>
          <AppText weight="800" size={18} color={theme.colors.ink} style={styles.prompt}>
            {question.prompt}
          </AppText>
          {question.helper ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{expanded: hintOpen}}
              onPress={() => setHintOpen(open => !open)}
              style={({pressed}) => [styles.hintButton, pressed && styles.pressed]}>
              <Icon name="bulb" size={14} color={theme.colors.orange} />
              <AppText weight="700" size={11} color={theme.colors.orange}>
                {hintOpen ? 'Hide hint' : 'Need a hint?'}
              </AppText>
            </Pressable>
          ) : null}
          {hintOpen && question.helper ? (
            <View style={styles.hintPanel}>
              <AppText size={11.5} color={theme.colors.ink} style={styles.helperText}>
                {question.helper}
              </AppText>
            </View>
          ) : null}
        </View>

        <View accessibilityRole="radiogroup" style={styles.options}>
          {question.options.map((option, optionIndex) => {
            const selected = answer === option.id;
            const correct = Boolean(feedback && question.correctOptionId === option.id);
            const incorrect = feedback === 'incorrect' && selected;
            const state = correct ? 'correct' : incorrect ? 'incorrect' : selected ? 'selected' : 'idle';
            const palette = optionPalette(state, theme.colors);
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{checked: selected, disabled: busy || Boolean(feedback) || remaining === 0}}
                accessibilityLabel={`${LETTERS[optionIndex] ?? optionIndex + 1}. ${option.label}`}
                disabled={busy || Boolean(feedback) || remaining === 0}
                onPress={() => onSelect(option.id)}
                style={({pressed}) => [
                  styles.option,
                  {backgroundColor: palette.background, borderColor: palette.border},
                  state !== 'idle' && styles.optionActive,
                  pressed && styles.optionPressed,
                ]}>
                <View style={[styles.optionLetter, {backgroundColor: palette.badge, borderColor: palette.border}]}>
                  <AppText weight="900" size={11} color={palette.accent}>
                    {LETTERS[optionIndex] ?? optionIndex + 1}
                  </AppText>
                </View>
                <AppText weight={selected || correct ? '800' : '600'} size={13} color={palette.text} style={styles.optionLabel}>
                  {option.label}
                </AppText>
                {state === 'correct' || state === 'incorrect' ? (
                  <View style={[styles.stateIcon, {backgroundColor: palette.accent}]}>
                    <Icon name={state === 'correct' ? 'check' : 'help'} size={12} color="#fff" strokeWidth={2.5} />
                  </View>
                ) : (
                  <View style={[styles.radio, selected && {borderColor: colors.primary}]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {feedback ? (
          <View style={[styles.feedback, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
            <View style={[styles.feedbackIcon, feedback === 'correct' ? styles.feedbackIconCorrect : styles.feedbackIconIncorrect]}>
              <Icon name={feedback === 'correct' ? 'check' : 'bulb'} size={17} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={styles.feedbackCopy}>
              <AppText
                weight="900"
                size={13}
                color={feedback === 'correct' ? theme.colors.success : theme.colors.orange}>
                {feedback === 'correct' ? 'Nicely done!' : 'Good try — keep going.'}
              </AppText>
              <AppText
                size={11.5}
                color={theme.colors.ink}
                style={styles.feedbackBody}>
                {feedback === 'correct'
                  ? question.helper ?? 'You picked the correct answer.'
                  : correctOption
                    ? `The correct answer is ${correctOption.label}.`
                    : 'Review the highlighted answer before continuing.'}
              </AppText>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.error} accessibilityRole="alert">
            <Icon name="wifi" size={15} color={colors.error} />
            <AppText size={11.5} weight="600" color={colors.error} style={styles.errorText}>
              {error}
            </AppText>
          </View>
        ) : null}

        {remaining === 0 ? (
          <View style={styles.timeUp} accessibilityRole="alert">
            <AppText weight="800" size={12} color={colors.error}>
              Time is up
            </AppText>
            <AppText size={11} color={theme.colors.text2}>
              Submit the answers that were saved before the timer ended.
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      <StickyActionFooter>
        <View style={styles.footerActions}>
          {!feedback && remaining !== 0 ? (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onSkip}
              style={({pressed}) => [styles.skipButton, pressed && styles.pressed, busy && styles.disabled]}>
              <AppText weight="800" size={12} color={theme.colors.text2}>
                Skip
              </AppText>
            </Pressable>
          ) : null}
          <ClayButton
            label={primaryLabel}
            icon={feedback && !finalQuestion ? 'skipf' : feedback && finalQuestion ? 'flag' : 'check'}
            disabled={busy || (!answer && remaining !== 0)}
            onPress={onAdvance}
            style={styles.primaryAction}
          />
        </View>
      </StickyActionFooter>
    </Screen>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function optionPalette(
  state: 'idle' | 'selected' | 'correct' | 'incorrect',
  palette: AppColors,
) {
  if (state === 'correct') {
    return {
      background: palette.pastel.green,
      border: palette.success,
      badge: palette.pastel.green,
      accent: palette.success,
      text: palette.ink,
    };
  }
  if (state === 'incorrect') {
    return {
      background: palette.pastel.red,
      border: palette.error,
      badge: palette.pastel.red,
      accent: palette.error,
      text: palette.ink,
    };
  }
  if (state === 'selected') {
    return {
      background: palette.pastel.blue,
      border: palette.primary,
      badge: palette.pastel.blue,
      accent: palette.primary,
      text: palette.ink,
    };
  }
  return {
    background: palette.white,
    border: palette.progressTrack,
    badge: palette.subtle,
    accent: palette.text3,
    text: palette.ink,
  };
}

const styles = createThemedStyles({
  page: {paddingHorizontal: space.pageX, paddingTop: 16, paddingBottom: 24, gap: 14},
  timer: {
    minWidth: 72,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.pastel.blue,
  },
  timerUrgent: {backgroundColor: colors.pastel.red},
  progressSection: {gap: 10},
  progressLabels: {gap: 8},
  eyebrowRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  dailyPill: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 99, backgroundColor: '#FEF3C7'},
  eyebrow: {letterSpacing: 0.8},
  questionMeta: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12},
  questionCard: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(30,64,175,0.08)',
    boxShadow: '0 16px 30px -20px rgba(15,23,42,0.45)',
  },
  questionTop: {flexDirection: 'row', alignItems: 'center', gap: 10},
  categoryIcon: {width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pastel.blue},
  categoryText: {gap: 2, flex: 1},
  categoryLabel: {letterSpacing: 0.8},
  prompt: {lineHeight: 26, letterSpacing: -0.25},
  hintButton: {alignSelf: 'flex-start', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 11, backgroundColor: '#FFFBEB'},
  hintPanel: {padding: 12, borderRadius: 12, backgroundColor: '#FFFBEB', borderLeftWidth: 3, borderLeftColor: '#F59E0B'},
  helperText: {lineHeight: 17},
  options: {gap: 10},
  option: {
    minHeight: 62,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  optionActive: {borderWidth: 1.75},
  optionPressed: {transform: [{scale: 0.99}], opacity: 0.92},
  optionLetter: {width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  optionLabel: {flex: 1, lineHeight: 18},
  radio: {width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center'},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary},
  stateIcon: {width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center'},
  feedback: {borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderWidth: 1},
  feedbackCorrect: {backgroundColor: '#F0FDF4', borderColor: '#BBF7D0'},
  feedbackIncorrect: {backgroundColor: '#FFF7ED', borderColor: '#FED7AA'},
  feedbackIcon: {width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center'},
  feedbackIconCorrect: {backgroundColor: '#16A34A'},
  feedbackIconIncorrect: {backgroundColor: '#EA580C'},
  feedbackCopy: {flex: 1, gap: 3},
  feedbackBody: {lineHeight: 17},
  error: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, backgroundColor: colors.pastel.red, borderRadius: 12},
  errorText: {flex: 1},
  timeUp: {gap: 3, padding: 13, backgroundColor: colors.pastel.red, borderRadius: 13},
  footerActions: {flexDirection: 'row', alignItems: 'center', gap: 10},
  skipButton: {minWidth: 76, minHeight: space.hit, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.chip, backgroundColor: colors.subtle},
  primaryAction: {flex: 1},
  pressed: {opacity: 0.78},
  disabled: {opacity: 0.45},
});
