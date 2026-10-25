import React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useQuery} from '@tanstack/react-query';
import {Icon, type IconName} from '../../assets/icons';
import {AppText, ClayButton, EmptyState, ErrorState, FilterChip, LoadingBlock, SearchInput} from '../../components/ui';
import {ClayCard, ClayIconTile} from '../../components/ui/Clay';
import {BrandedHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import type {CatalogItem, InterviewQuestion} from '../../core/types';
import type {HomeNav} from '../../navigation/types';
import {clay, colors, gradients} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {styles} from './styles';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

const shortTopicNames: Record<string, string> = {
  'int-hr': 'HR',
  'int-tech': 'Technical',
  'int-gd': 'Group discussion',
  'int-apt': 'Aptitude',
  'int-mock': 'Mock interview',
  'int-resume': 'Resume',
};

export function InterviewPrepScreen() {
  const navigation = useNavigation<HomeNav>();
  const repos = useRepositories();
  const theme = useTheme();
  const [selectedTopic, setSelectedTopic] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [showAllQuestions, setShowAllQuestions] = React.useState(false);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog('interview', {}),
    queryFn: () => repos.catalog.list({kind: 'interview'}),
  });
  const questionsQuery = useQuery({
    queryKey: queryKeys.interview({}),
    queryFn: () => repos.content.interviewQuestions(),
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: categoriesQuery.isRefetching || questionsQuery.isRefetching,
    onRefresh: () => {
      Promise.all([categoriesQuery.refetch(), questionsQuery.refetch()]).catch(
        () => undefined,
      );
    },
  });

  const categories = React.useMemo(
    () => categoriesQuery.data?.items ?? [],
    [categoriesQuery.data?.items],
  );
  const questions = questionsQuery.data ?? [];
  const categoryById = React.useMemo(
    () => new Map(categories.map(item => [item.id, item])),
    [categories],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const visibleQuestions = questions.filter(item => {
    const matchesTopic = selectedTopic === 'all' || item.categoryId === selectedTopic;
    const categoryName = categoryById.get(item.categoryId)?.title ?? '';
    const matchesSearch = !normalizedSearch ||
      item.prompt.toLowerCase().includes(normalizedSearch) ||
      categoryName.toLowerCase().includes(normalizedSearch);
    return matchesTopic && matchesSearch;
  });
  const visibleCategories = categories.filter(item =>
    !normalizedSearch || item.title.toLowerCase().includes(normalizedSearch),
  );
  const displayedQuestions = showAllQuestions ? visibleQuestions : visibleQuestions.slice(0, 3);
  const warmupQuestions = visibleQuestions.length ? visibleQuestions : questions;
  const freeTopicCount = categories.filter(item => item.access.state === 'granted').length;

  const openQuestion = (question: InterviewQuestion) => {
    navigation.navigate('InterviewQuestion', {questionId: question.id});
  };

  const startWarmup = () => {
    const first = warmupQuestions[0];
    if (first) openQuestion(first);
  };

  const surpriseMe = () => {
    if (!questions.length) return;
    const next = questions[Math.floor(Math.random() * questions.length)];
    openQuestion(next);
  };

  const openCategory = (item: CatalogItem) => {
    if (item.access.state === 'denied' && item.access.reason === 'purchase_required') {
      showLearnerUnavailable();
      return;
    }
    navigation.navigate('InterviewQuestionList', {categoryId: item.id});
  };

  const mockCategory = categories.find(item => item.id === 'int-mock');
  const hasError = categoriesQuery.isError || questionsQuery.isError;
  const isLoading = categoriesQuery.isLoading || questionsQuery.isLoading;

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <BrandedHeader
        showBack
        onBack={() => navigation.goBack()}
        onNotifications={showLearnerUnavailable}
        unread
      />
      <ScrollView
        {...pullRefresh.scrollProps}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <View style={styles.eyebrow}>
            <Icon name="target" size={12} color={colors.primary} />
            <AppText weight="800" size={10} color={colors.primary} style={styles.eyebrowText}>
              INTERVIEW WORKOUT
            </AppText>
          </View>
          <AppText weight="900" size={25} color={theme.colors.navy}>
            Prepare with purpose
          </AppText>
          <AppText size={12.5} color={theme.colors.text2} style={styles.introCopy}>
            Turn common questions into confident, job-ready answers.
          </AppText>
        </View>

        <Gradient
          colors={gradients.interview}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.hero}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.heroCopy}>
            <View style={styles.heroLabel}>
              <Icon name="zap" size={11} color="#CFFAF1" />
              <AppText weight="800" size={9.5} color="#E6FFF9" style={styles.heroLabelText}>
                RECOMMENDED WARM-UP
              </AppText>
            </View>
            <AppText weight="900" size={20} color="#FFFFFF" style={styles.heroTitle}>
              One strong answer starts here
            </AppText>
            <AppText size={11.5} color="rgba(255,255,255,0.82)" style={styles.heroBody}>
              Think for 30 seconds, answer aloud, then compare with the model response.
            </AppText>
            <ClayButton
              label={warmupQuestions.length ? 'Start 5-min practice' : 'No questions yet'}
              tone="ghost"
              icon="play"
              compact
              onPress={warmupQuestions.length ? startWarmup : undefined}
              style={styles.heroButton}
            />
          </View>
          <View style={styles.heroMeter}>
            <View style={styles.heroMeterInner}>
              <AppText weight="900" size={24} color="#FFFFFF">
                {questions.length || '—'}
              </AppText>
              <AppText weight="700" size={8.5} color="rgba(255,255,255,0.7)" center>
                ANSWERS
              </AppText>
            </View>
          </View>
        </Gradient>

        <View style={styles.snapshot}>
          <SnapshotItem icon="clock" value="5 min" label="quick session" />
          <View style={styles.snapshotDivider} />
          <SnapshotItem icon="bookopen" value={`${freeTopicCount}`} label="free topics" />
          <View style={styles.snapshotDivider} />
          <SnapshotItem icon="mic" value="Speak" label="practice aloud" />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <AppText weight="900" size={17} color={theme.colors.navy}>Practice your way</AppText>
            <AppText size={11} color={theme.colors.text2} style={styles.sectionSubtitle}>
              Pick what you need right now
            </AppText>
          </View>
        </View>
        <View style={styles.actionRow}>
          <QuickAction
            title="Surprise me"
            body="Try a random question"
            icon="refresh"
            color={clay.purple.icon}
            background={theme.colors.pastel.purple}
            onPress={questions.length ? surpriseMe : undefined}
          />
          <QuickAction
            title="1-on-1 mock"
            body="Get guided feedback"
            icon="video"
            color={clay.orange.icon}
            background={theme.colors.pastel.orange}
            badge="PRO"
            onPress={mockCategory ? () => openCategory(mockCategory) : undefined}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <AppText weight="900" size={17} color={theme.colors.navy}>Question bank</AppText>
            <AppText size={11} color={theme.colors.text2} style={styles.sectionSubtitle}>
              Search or narrow down by topic
            </AppText>
          </View>
        </View>
        <SearchInput
          value={search}
          placeholder="Search questions or topics"
          onChangeText={value => {
            setSearch(value);
            setShowAllQuestions(false);
          }}
          onClear={() => setSearch('')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          <FilterChip
            label="All topics"
            selected={selectedTopic === 'all'}
            onPress={() => {
              setSelectedTopic('all');
              setShowAllQuestions(false);
            }}
          />
          {categories.filter(item => item.id !== 'int-mock').map(item => (
            <FilterChip
              key={item.id}
              label={shortTopicNames[item.id] ?? item.title}
              selected={selectedTopic === item.id}
              onPress={() => {
                setSelectedTopic(item.id);
                setShowAllQuestions(false);
              }}
            />
          ))}
        </ScrollView>

        {hasError ? (
          <ErrorState
            message="Interview practice could not load."
            onRetry={() => {
              categoriesQuery.refetch();
              questionsQuery.refetch();
            }}
          />
        ) : isLoading ? (
          <LoadingBlock />
        ) : (
          <>
            {displayedQuestions.length ? (
              <View style={styles.questionList}>
                {displayedQuestions.map((item, index) => (
                  <QuestionCard
                    key={item.id}
                    item={item}
                    index={index}
                    category={categoryById.get(item.categoryId)}
                    onPress={() => openQuestion(item)}
                  />
                ))}
                {visibleQuestions.length > 3 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowAllQuestions(value => !value)}
                    style={styles.showMore}>
                    <AppText weight="800" size={12} color={colors.primary}>
                      {showAllQuestions ? 'Show fewer questions' : `Show all ${visibleQuestions.length} questions`}
                    </AppText>
                    <Icon name="chev" size={13} color={colors.primary} style={showAllQuestions ? styles.chevronUp : undefined} />
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <EmptyState
                title="No matching questions"
                body="Try another topic or clear your search."
                actionLabel="Clear filters"
                onAction={() => {
                  setSearch('');
                  setSelectedTopic('all');
                }}
              />
            )}

            <View style={styles.sectionHeader}>
              <View>
                <AppText weight="900" size={17} color={theme.colors.navy}>Explore prep topics</AppText>
                <AppText size={11} color={theme.colors.text2} style={styles.sectionSubtitle}>
                  Guides, exercises and premium coaching
                </AppText>
              </View>
            </View>
            {visibleCategories.length ? (
              <View style={styles.topicGrid}>
                {visibleCategories.map(item => (
                  <TopicCard key={item.id} item={item} onPress={() => openCategory(item)} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function SnapshotItem({icon, value, label}: {icon: IconName; value: string; label: string}) {
  return (
    <View style={styles.snapshotItem}>
      <Icon name={icon} size={14} color={colors.primary} />
      <View>
        <AppText weight="900" size={11.5} color={colors.navy}>{value}</AppText>
        <AppText size={8.5} color={colors.text2}>{label}</AppText>
      </View>
    </View>
  );
}

function QuickAction({
  title,
  body,
  icon,
  color,
  background,
  badge,
  onPress,
}: {
  title: string;
  body: string;
  icon: IconName;
  color: string;
  background: string;
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: !onPress}}
      disabled={!onPress}
      onPress={onPress}
      style={({pressed}) => [styles.quickAction, {backgroundColor: background}, pressed && styles.pressed]}>
      <View style={styles.quickActionTop}>
        <View style={styles.quickIcon}>
          <Icon name={icon} size={18} color={color} />
        </View>
        {badge ? (
          <View style={[styles.proBadge, {backgroundColor: color}]}>
            <AppText weight="900" size={7.5} color="#FFFFFF">{badge}</AppText>
          </View>
        ) : (
          <Icon name="chev" size={14} color={color} />
        )}
      </View>
      <AppText weight="900" size={13} color={colors.navy}>{title}</AppText>
      <AppText size={10} color={colors.text2}>{body}</AppText>
    </Pressable>
  );
}

function QuestionCard({
  item,
  index,
  category,
  onPress,
}: {
  item: InterviewQuestion;
  index: number;
  category?: CatalogItem;
  onPress: () => void;
}) {
  return (
    <ClayCard variant="white" padded={false} onPress={onPress} style={styles.questionCard}>
      <View style={styles.questionNumber}>
        <AppText weight="900" size={11} color={colors.primary}>
          {String(index + 1).padStart(2, '0')}
        </AppText>
      </View>
      <View style={styles.questionCopy}>
        <AppText weight="800" size={13} color={colors.navy} numberOfLines={2}>
          {item.prompt}
        </AppText>
        <View style={styles.questionMeta}>
          <AppText weight="700" size={9.5} color={colors.text2}>
            {category ? shortTopicNames[category.id] ?? category.title : 'Interview'}
          </AppText>
          <View style={styles.metaDot} />
          <AppText size={9.5} color={colors.text2}>Model answer</AppText>
        </View>
      </View>
      <View style={styles.questionArrow}>
        <Icon name="chev" size={14} color={colors.primary} />
      </View>
    </ClayCard>
  );
}

function TopicCard({item, onPress}: {item: CatalogItem; onPress: () => void}) {
  const isLocked = item.access.state === 'denied';
  return (
    <ClayCard variant={item.clay} padded={false} onPress={onPress} style={styles.topicCard}>
      <View style={styles.topicTop}>
        <ClayIconTile icon={item.icon as IconName} color={item.iconColor} size={38} />
        <Icon name={isLocked ? 'lock' : 'chev'} size={13} color={isLocked ? colors.orange : colors.text3} />
      </View>
      <AppText weight="900" size={12} color={colors.navy} numberOfLines={2} style={styles.topicTitle}>
        {item.title}
      </AppText>
      <AppText weight="700" size={9} color={isLocked ? colors.orange : colors.success}>
        {isLocked ? 'PREMIUM' : 'START PRACTICE'}
      </AppText>
    </ClayCard>
  );
}
