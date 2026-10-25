import React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {Icon} from '../../assets/icons';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {useRepositories} from '../../core/di';
import {useBookmark} from '../../core/useBookmark';
import {colors} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import type {HomeNav} from '../../navigation/types';
import {styles} from './styles';

const PRACTICE_SECONDS = 60;

export function InterviewQuestionScreen() {
  const navigation = useNavigation<HomeNav>();
  const questionId = (useRoute().params as {questionId: string}).questionId;
  const repos = useRepositories();
  const theme = useTheme();
  const saveQuestion = useBookmark({kind: 'interviewQuestion', id: questionId});
  const [secondsLeft, setSecondsLeft] = React.useState(PRACTICE_SECONDS);
  const [isRunning, setIsRunning] = React.useState(false);
  const [answerVisible, setAnswerVisible] = React.useState(false);
  const questionQuery = useQuery({
    queryKey: ['interview', questionId],
    queryFn: () => repos.content.interviewQuestion(questionId),
  });

  React.useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft(value => {
        if (value <= 1) {
          setIsRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(PRACTICE_SECONDS);
  };

  const toggleTimer = () => {
    if (secondsLeft === 0) setSecondsLeft(PRACTICE_SECONDS);
    setIsRunning(value => !value);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const progress = secondsLeft / PRACTICE_SECONDS;

  return (
    <Screen padded={false}>
      <DetailHeader
        title="Answer practice"
        subtitle="Think clearly · speak naturally"
        onBack={() => navigation.goBack()}
        onBookmark={saveQuestion}
      />
      <ScrollView contentContainerStyle={styles.practicePage} showsVerticalScrollIndicator={false}>
        {questionQuery.isLoading ? (
          <LoadingBlock />
        ) : questionQuery.isError || !questionQuery.data ? (
          <ErrorState message="This interview question could not load." onRetry={() => questionQuery.refetch()} />
        ) : (
          <>
            <View style={styles.practiceStep}>
              <View style={styles.stepNumber}>
                <AppText weight="900" size={10} color="#FFFFFF">1</AppText>
              </View>
              <AppText weight="800" size={11} color={colors.primary} style={styles.stepLabel}>
                READ THE PROMPT
              </AppText>
            </View>
            <ClayCard variant="indigo" style={styles.promptCard}>
              <View style={styles.quoteMark}>
                <AppText face="caveat" weight="700" size={28} color={colors.primary}>“</AppText>
              </View>
              <AppText weight="900" size={20} color={theme.colors.navy} style={styles.promptText}>
                {questionQuery.data.prompt}
              </AppText>
              <AppText size={11.5} color={theme.colors.text2} style={styles.promptHint}>
                Take a breath. Build your answer before you start speaking.
              </AppText>
            </ClayCard>

            <View style={styles.practiceStep}>
              <View style={styles.stepNumber}>
                <AppText weight="900" size={10} color="#FFFFFF">2</AppText>
              </View>
              <AppText weight="800" size={11} color={colors.primary} style={styles.stepLabel}>
                ANSWER OUT LOUD
              </AppText>
            </View>
            <View style={styles.timerCard}>
              <View style={styles.timerVisual}>
                <View style={[styles.timerProgress, {opacity: 0.18 + progress * 0.42}]} />
                <View style={styles.timerInner}>
                  <Icon name="mic" size={19} color={isRunning ? colors.success : colors.primary} />
                  <AppText face="mono" weight="800" size={22} color={theme.colors.navy}>
                    {minutes}:{seconds}
                  </AppText>
                  <AppText weight="700" size={8.5} color={theme.colors.text2}>
                    {isRunning ? 'SPEAKING' : secondsLeft === 0 ? 'TIME' : 'READY'}
                  </AppText>
                </View>
              </View>
              <View style={styles.timerCopy}>
                <AppText weight="900" size={15} color={theme.colors.navy}>
                  Keep it under a minute
                </AppText>
                <AppText size={11} color={theme.colors.text2} style={styles.timerBody}>
                  Aim for a clear opening, one useful example, and a confident close.
                </AppText>
                <View style={styles.timerActions}>
                  <ClayButton
                    label={isRunning ? 'Pause' : secondsLeft === 0 ? 'Try again' : 'Start timer'}
                    icon={isRunning ? undefined : 'play'}
                    compact
                    onPress={toggleTimer}
                    style={styles.timerButton}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reset timer"
                    onPress={resetTimer}
                    style={styles.resetButton}>
                    <Icon name="refresh" size={16} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.coachingRow}>
              <CoachingCue number="01" label="Lead with the answer" />
              <CoachingCue number="02" label="Add one proof point" />
              <CoachingCue number="03" label="Finish with relevance" />
            </View>

            <View style={styles.practiceStep}>
              <View style={styles.stepNumber}>
                <AppText weight="900" size={10} color="#FFFFFF">3</AppText>
              </View>
              <AppText weight="800" size={11} color={colors.primary} style={styles.stepLabel}>
                COMPARE & IMPROVE
              </AppText>
            </View>
            <ClayButton
              label={answerVisible ? 'Hide model answer' : 'Reveal model answer'}
              tone={answerVisible ? 'ghost' : 'success'}
              icon={answerVisible ? 'eye' : 'bookopen'}
              onPress={() => setAnswerVisible(value => !value)}
            />
            {answerVisible ? (
              <ClayCard variant="mint" style={styles.answerCard}>
                <View style={styles.answerHeader}>
                  <View style={styles.answerIcon}>
                    <Icon name="bulb" size={16} color={colors.success} />
                  </View>
                  <View style={styles.answerHeading}>
                    <AppText weight="900" size={14} color={theme.colors.navy}>A strong approach</AppText>
                    <AppText size={9.5} color={theme.colors.text2}>Use this as a guide, not a script</AppText>
                  </View>
                </View>
                <AppText size={12.5} color={theme.colors.ink} style={styles.answerText}>
                  {questionQuery.data.modelAnswer ?? 'Focus on a direct answer supported by one relevant example.'}
                </AppText>
                <View style={styles.personalizeTip}>
                  <Icon name="star" size={13} color="#8A5A00" />
                  <AppText size={10.5} color="#6B4A00" style={styles.tipCopy}>
                    Replace general claims with details from your own study, projects, or experience.
                  </AppText>
                </View>
              </ClayCard>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function CoachingCue({number, label}: {number: string; label: string}) {
  return (
    <View style={styles.coachingCue}>
      <AppText face="mono" weight="800" size={9} color={colors.primary}>{number}</AppText>
      <AppText weight="700" size={9.5} color={colors.text2} center style={styles.coachingLabel}>
        {label}
      </AppText>
    </View>
  );
}
