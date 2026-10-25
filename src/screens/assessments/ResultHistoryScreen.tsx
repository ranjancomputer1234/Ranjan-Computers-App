import React from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import Svg, {Circle} from 'react-native-svg';
import {Icon} from '../../assets/icons';
import {useRepositories} from '../../core/di';
import {accountKey} from '../../core/session';
import type {TestResult} from '../../core/types';
import {AppText, EmptyState, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {Gradient} from '../../components/ui/Gradient';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {colors, gradients} from '../../theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {LearningStackParamList} from '../../navigation/types';
import {
  filterResultHistory,
  resultBand,
  summarizeResults,
  type HistoryFilter,
} from '../../features/assessments/resultHistory';
import {
  calculateAccuracy,
  formatDuration,
  formatRank,
} from '../../features/assessments/hooks/useTestResult';
import {styles} from './styles';

const FILTERS: {key: HistoryFilter; label: string}[] = [
  {key: 'all', label: 'All'},
  {key: 'strong', label: '70% & above'},
  {key: 'focus', label: 'Needs review'},
];

export function ResultHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LearningStackParamList>>();
  const repos = useRepositories();
  const [filter, setFilter] = React.useState<HistoryFilter>('all');
  const history = useQuery({
    queryKey: ['history', accountKey()],
    queryFn: () => repos.assessments.history(),
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: history.isRefetching,
    onRefresh: () => {
      history.refetch().catch(() => undefined);
    },
  });
  const results = React.useMemo(() => history.data ?? [], [history.data]);
  const summary = React.useMemo(() => summarizeResults(results), [results]);
  const visibleResults = React.useMemo(
    () => filterResultHistory(results, filter),
    [filter, results],
  );
  const strongCount = results.filter(item => item.percent >= 70).length;
  const focusCount = results.length - strongCount;

  const retry = (item: TestResult) => {
    Alert.alert(
      'Retry this test?',
      'A new attempt will start. Your previous result will remain saved.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Retry Test',
          onPress: () => navigation.navigate('TestInstructions', {testId: item.testId}),
        },
      ],
    );
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Test Results"
        subtitle="Track your progress"
        onBack={() => navigation.goBack()}
      />
      {history.isLoading ? <LoadingBlock /> : null}
      {history.isError ? (
        <ErrorState
          message="Your test history could not be loaded."
          onRetry={() => history.refetch()}
        />
      ) : null}
      {!history.isLoading && !history.isError ? (
        <ScrollView
          {...pullRefresh.scrollProps}
          contentContainerStyle={styles.historyPage}
          showsVerticalScrollIndicator={false}>
          {results.length ? (
            <>
              <Gradient colors={gradients.banner} style={styles.historyHero}>
                <View style={styles.historyHeroTop}>
                  <View style={styles.historyHeroIcon}>
                    <Icon name="trophy" size={22} color="#F9A825" />
                  </View>
                  <View style={styles.historyHeroCopy}>
                    <AppText weight="900" size={18} color="#fff">
                      Your progress
                    </AppText>
                    <AppText size={10.5} color="rgba(255,255,255,0.78)" style={styles.historyHeroSubtitle}>
                      Every attempt is a step forward
                    </AppText>
                  </View>
                  <View style={styles.historyHeroBadge}>
                    <Icon name="trendup" size={13} color="#fff" />
                    <AppText weight="800" size={9} color="#fff">
                      KEEP GOING
                    </AppText>
                  </View>
                </View>
                <View style={styles.historyStats}>
                  <HistoryStat label="ATTEMPTS" value={`${summary.attempts}`} />
                  <View style={styles.historyStatDivider} />
                  <HistoryStat label="AVERAGE" value={`${summary.average}%`} />
                  <View style={styles.historyStatDivider} />
                  <HistoryStat label="BEST SCORE" value={`${summary.best}%`} />
                </View>
                <View style={styles.historyInsight}>
                  <Icon name="bulb" size={15} color="#FFE082" />
                  <AppText size={10} color="rgba(255,255,255,0.9)" style={styles.historyInsightText}>
                    {summary.average >= 70
                      ? 'Strong overall performance. Review missed questions before your next attempt.'
                      : 'Focus on one weak section at a time, review solutions, and try again.'}
                  </AppText>
                </View>
              </Gradient>

              <View style={styles.historyHeading}>
                <View>
                  <AppText weight="900" size={17} color={colors.navy}>
                    Your attempts
                  </AppText>
                  <AppText size={9.5} color={colors.text2} style={styles.historyHeadingSubtitle}>
                    Review performance or start another attempt
                  </AppText>
                </View>
                <View style={styles.historyCountBadge}>
                  <AppText weight="900" size={10} color={colors.primary}>
                    {results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'}
                  </AppText>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyFilters}
                accessibilityRole="tablist">
                {FILTERS.map(item => {
                  const count = item.key === 'all' ? results.length : item.key === 'strong' ? strongCount : focusCount;
                  const selected = filter === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      accessibilityRole="tab"
                      accessibilityState={{selected}}
                      onPress={() => setFilter(item.key)}
                      style={({pressed}) => [
                        styles.historyFilter,
                        selected && styles.historyFilterOn,
                        pressed && styles.pressed,
                      ]}>
                      <AppText weight="800" size={10.5} color={selected ? '#fff' : colors.navy}>
                        {item.label} {count}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {visibleResults.length ? (
                <View style={styles.historyList}>
                  {visibleResults.map((item, index) => (
                    <ResultCard
                      key={item.attemptId}
                      item={item}
                      index={results.findIndex(result => result.attemptId === item.attemptId) + 1 || index + 1}
                      onReview={() => navigation.navigate('TestResult', {attemptId: item.attemptId})}
                      onRetry={() => retry(item)}
                    />
                  ))}
                </View>
              ) : (
                <ClayCard variant="sky" style={styles.historyFilterEmpty}>
                  <Icon name="clipboard" size={24} color={colors.primary} />
                  <AppText weight="800" size={14} color={colors.navy} center>
                    No results in this filter
                  </AppText>
                  <AppText size={10.5} color={colors.text2} center>
                    Your other attempts are still available under All.
                  </AppText>
                  <Pressable accessibilityRole="button" onPress={() => setFilter('all')}>
                    <AppText weight="800" size={11} color={colors.primary}>
                      Show all results
                    </AppText>
                  </Pressable>
                </ClayCard>
              )}
            </>
          ) : (
            <EmptyState
              title="No test results yet"
              body="Complete your first test and its score, analysis, and solutions will appear here."
            />
          )}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function HistoryStat({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.historyStat}>
      <AppText weight="900" size={20} color="#fff">
        {value}
      </AppText>
      <AppText weight="700" size={8.5} color="rgba(255,255,255,0.7)" style={styles.historyStatLabel}>
        {label}
      </AppText>
    </View>
  );
}

function ResultCard({
  item,
  index,
  onReview,
  onRetry,
}: {
  item: TestResult;
  index: number;
  onReview: () => void;
  onRetry: () => void;
}) {
  const title = item.testTitle ?? `Test attempt ${index}`;
  const band = resultBand(item.percent);
  const palette =
    band === 'Excellent'
      ? {color: '#2E7D32', soft: colors.pastel.green}
      : band === 'Strong'
        ? {color: '#1565C0', soft: colors.pastel.blue}
        : band === 'Building'
          ? {color: '#EF6C00', soft: colors.pastel.orange}
          : {color: '#C62828', soft: colors.pastel.red};
  const accuracy = item.accuracy ?? calculateAccuracy(item.questions);
  const time = formatDuration(item.timeTakenSeconds);
  const rank = formatRank(item.rank, item.rankTotal);

  return (
    <ClayCard variant="white" padded={false} style={styles.historyCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}, score ${Math.round(item.percent)} percent`}
        onPress={onReview}
        style={({pressed}) => [styles.historyCardMain, pressed && styles.pressed]}>
        <MiniScoreRing percent={item.percent} color={palette.color} />
        <View style={styles.historyCardCopy}>
          <View style={[styles.historyBand, {backgroundColor: palette.soft}]}>
            <AppText weight="900" size={8.5} color={palette.color} style={styles.historyBandText}>
              {band.toUpperCase()}
            </AppText>
          </View>
          <AppText weight="900" size={13} color={colors.navy} numberOfLines={2} style={styles.historyCardTitle}>
            {title}
          </AppText>
          <AppText size={10} color={colors.text2}>
            {item.score}/{item.maxScore} marks
          </AppText>
        </View>
        <Icon name="chev" size={17} color={colors.text2} />
      </Pressable>

      <View style={styles.historyMeta}>
        {accuracy != null ? <HistoryMeta icon="target" label="Accuracy" value={`${Math.round(accuracy)}%`} /> : null}
        {time ? <HistoryMeta icon="clock" label="Time" value={time} /> : null}
        {rank ? <HistoryMeta icon="award" label="Rank" value={rank.replace('Rank ', '#').split(' / ')[0]} /> : null}
      </View>

      <View style={styles.historyActions}>
        <Pressable
          accessibilityRole="button"
          onPress={onReview}
          style={({pressed}) => [styles.historyReviewButton, pressed && styles.pressed]}>
          <Icon name="eye" size={14} color={colors.primary} />
          <AppText weight="800" size={10.5} color={colors.primary}>
            Review result
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({pressed}) => [styles.historyRetryButton, pressed && styles.pressed]}>
          <Icon name="refresh" size={14} color="#fff" />
          <AppText weight="800" size={10.5} color="#fff">
            Retry test
          </AppText>
        </Pressable>
      </View>
    </ClayCard>
  );
}

function HistoryMeta({icon, label, value}: {icon: 'target' | 'clock' | 'award'; label: string; value: string}) {
  return (
    <View style={styles.historyMetaItem}>
      <Icon name={icon} size={13} color={colors.primary} />
      <View style={styles.historyMetaCopy}>
        <AppText size={8} color={colors.text2}>
          {label}
        </AppText>
        <AppText weight="800" size={9.5} color={colors.navy} numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function MiniScoreRing({percent, color}: {percent: number; color: string}) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  return (
    <View
      style={styles.miniScore}
      accessibilityRole="progressbar"
      accessibilityValue={{min: 0, max: 100, now: Math.round(safePercent)}}>
      <Svg width={64} height={64} style={styles.miniScoreSvg}>
        <Circle cx={32} cy={32} r={radius} fill="none" stroke="#E2E8F2" strokeWidth={7} />
        <Circle
          cx={32}
          cy={32}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - safePercent / 100)}
        />
      </Svg>
      <View pointerEvents="none" style={styles.miniScoreValue}>
        <AppText weight="900" size={13} color={color}>
          {Math.round(safePercent)}%
        </AppText>
      </View>
    </View>
  );
}
