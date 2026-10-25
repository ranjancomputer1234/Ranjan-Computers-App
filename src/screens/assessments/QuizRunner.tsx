import React from 'react';
import {Alert, AppState, ScrollView, View} from 'react-native';
import {useNavigation, usePreventRemove, useRoute} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {colors} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen, StickyActionFooter} from '../../components/layout/Screen';
import {styles} from './styles';
import {accountKey} from '../../core/session';
import {queryKeys} from '../../core/query';
import {remainingSeconds, saveAttemptAnswer} from '../../features/assessments/attemptActions';
import type {RootNav} from '../../navigation/types';
import type {Attempt, Question} from '../../core/types';
import {DailyQuizExperience} from './DailyQuizExperience';

export function QuizRunner({formal}: {formal?: boolean}) {
  const navigation = useNavigation<RootNav>();
  const route = useRoute();
  const params = route.params as {attemptId?: string; testId?: string};
  const repos = useRepositories();
  const client = useQueryClient();
  const key = queryKeys.attempt(accountKey(), params.attemptId ?? '');
  const attempt = useQuery({
    queryKey: key,
    queryFn: () => repos.assessments.attempt(params.attemptId!),
    enabled: Boolean(params.attemptId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const [index, setIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<string | undefined>();
  const [feedback, setFeedback] = React.useState<'correct' | 'incorrect' | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [finished, setFinished] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());
  const operation = React.useRef(false);
  const timeoutSubmitted = React.useRef(false);
  const latest = React.useRef<Attempt & {questions: Question[]} | undefined>(undefined);
  if (attempt.data && (!latest.current || attempt.data.revision >= latest.current.revision)) latest.current = attempt.data;
  const question = attempt.data?.questions[index];
  const remaining = remainingSeconds(attempt.data?.expiresAt, now);
  const answer = selected ?? (question ? attempt.data?.answers[question.id] : undefined);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') setNow(Date.now()); });
    return () => { clearInterval(timer); sub.remove(); };
  }, []);
  usePreventRemove(!finished && attempt.data?.status === 'in_progress', ({data}) => {
    if (operation.current) return;
    Alert.alert('Leave this attempt?', 'Answers you have saved can be restored. The timer continues while you are away.', [
      {text: 'Stay', style: 'cancel'},
      {text: 'Leave', onPress: () => navigation.dispatch(data.action)},
    ]);
  });

  const submit = async (current: Attempt) => {
    const result = await repos.assessments.submit(current.id, current.revision);
    client.setQueryData(key, {...latest.current, status: 'scored'});
    client.setQueryData(queryKeys.result(accountKey(), result.attemptId), result);
    setFinished(true);
  };
  React.useEffect(() => {
    if (finished || attempt.data?.status === 'scored' || attempt.data?.status === 'submitted') {
      navigation.replace('Main', {screen: 'LearningTab', params: {screen: 'TestResult', params: {attemptId: params.attemptId!}}});
    }
  }, [finished, attempt.data?.status, navigation, params.attemptId]);

  const advance = async (timedOut = false) => {
    if (operation.current || !latest.current || !question) return;
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      let current = latest.current;
      if (!timedOut && answer && !feedback) {
        const saved = await saveAttemptAnswer(repos.assessments, current, question.id, answer);
        current = {...current, ...saved};
        latest.current = current;
        client.setQueryData(key, current);
        if (!formal && question.revealAnswer && question.correctOptionId) {
          setFeedback(answer === question.correctOptionId ? 'correct' : 'incorrect');
          return;
        }
      }
      if (timedOut || index === current.questions.length - 1) {
        await submit(current);
      } else {
        setIndex(i => i + 1);
        setSelected(undefined);
        setFeedback(null);
      }
    } catch (err) {
      setError((err as {message?: string}).message ?? 'Your answer could not be saved. Please retry.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  const skip = async () => {
    if (operation.current || !latest.current || !question || remaining === 0) return;
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      if (index === latest.current.questions.length - 1) {
        await submit(latest.current);
      } else {
        setIndex(i => i + 1);
        setSelected(undefined);
        setFeedback(null);
      }
    } catch (err) {
      setError((err as {message?: string}).message ?? 'The quiz could not continue. Please retry.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  React.useEffect(() => {
    if (remaining === 0 && !busy && attempt.data?.status === 'in_progress' && !timeoutSubmitted.current) {
      timeoutSubmitted.current = true;
      void advance(true);
    }
  });

  if (attempt.isLoading) return <Screen><LoadingBlock /></Screen>;
  if (!question) return <Screen><DetailHeader title="Assessment" onBack={() => navigation.goBack()} /><ErrorState message="This attempt could not be restored." onRetry={() => void attempt.refetch()} /></Screen>;

  if (!formal) {
    return (
      <DailyQuizExperience
        question={question}
        index={index}
        total={attempt.data?.questions.length ?? 0}
        answer={answer}
        answeredCount={Object.keys(attempt.data?.answers ?? {}).length}
        feedback={feedback}
        remaining={remaining}
        busy={busy}
        error={error}
        onBack={() => navigation.goBack()}
        onSelect={optionId => {
          setSelected(optionId);
          setFeedback(null);
        }}
        onAdvance={() => void advance(remaining === 0)}
        onSkip={() => void skip()}
      />
    );
  }

  return (
    <Screen padded={false}>
      <DetailHeader title={formal ? 'Test' : 'Daily Quiz'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.page}>
        {remaining !== null ? <AppText accessibilityLabel={`Time remaining ${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds`} face="mono" weight="700" size={16} color={remaining === 0 ? colors.error : colors.orange}>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</AppText> : null}
        <AppText size={12} color={colors.text2}>Question {index + 1} of {attempt.data?.questions.length}</AppText>
        <ClayCard variant="white">
          <AppText weight="800" size={15} color={colors.navy}>{question.prompt}</AppText>
          {question.helper ? <AppText size={12} color={colors.text2}>{question.helper}</AppText> : null}
        </ClayCard>
        {question.options.map(option => {
          const on = answer === option.id;
          const revealed = !formal && on ? feedback : null;
          const tone = revealed === 'incorrect' ? 'pink' : revealed === 'correct' ? 'green' : on ? 'blue' : 'white';
          return (
            <ClayCard key={option.id} variant={tone} onPress={busy || remaining === 0 || Boolean(feedback) ? undefined : () => { setSelected(option.id); setFeedback(null); }}>
              <AppText weight="700">{option.label}</AppText>
            </ClayCard>
          );
        })}
        {!formal && feedback ? (
          <AppText color={feedback === 'correct' ? colors.success : colors.error}>{feedback === 'correct' ? 'Correct' : 'Not quite'}</AppText>
        ) : null}
        {error ? <AppText accessibilityRole="alert" color={colors.error}>{error}</AppText> : null}
        {remaining === 0 ? <AppText>Time is up. Only answers accepted by the server can be submitted.</AppText> : null}
      </ScrollView>
      <StickyActionFooter>
        <View style={{gap: 8}}>
          {index > 0 && formal && remaining !== 0 ? <ClayButton label="Previous question" tone="ghost" disabled={busy} onPress={() => { setIndex(i => i - 1); setSelected(undefined); }} /> : null}
          <ClayButton disabled={busy || (!answer && remaining !== 0)}
            label={busy ? 'Saving…' : remaining === 0 ? 'Submit saved answers' : !formal && question.revealAnswer && !feedback ? 'Check answer' : index + 1 === attempt.data?.questions.length ? 'Submit answers' : 'Next question'}
            onPress={() => void advance(remaining === 0)} />
        </View>
      </StickyActionFooter>
    </Screen>
  );
}
