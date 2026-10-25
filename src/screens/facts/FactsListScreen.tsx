import React from 'react';
import {FlatList, Pressable, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Icon, type IconName} from '../../assets/icons';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {
  AppText,
  ClayButton,
  ClayCard,
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '../../components/ui';
import {IconButton} from '../../components/ui/Clay';
import {shareService} from '../../core/services';
import type {Fact} from '../../core/types';
import {useBookmark} from '../../core/useBookmark';
import {useFactsList} from '../../features/facts/hooks/useFactsList';
import type {HomeNav} from '../../navigation/types';
import {clay, colors, type ClayVariant} from '../../theme';
import {styles} from './styles';
import {virtualizedListPerformanceProps} from '../../components/layout/listPerformance';

type FactsListParams = {
  categoryId?: string;
  categoryTitle?: string;
  categorySubtitle?: string;
};

const CATEGORY_DETAILS: Record<
  string,
  {title: string; subtitle: string; sectionTitle: string; icon: IconName}
> = {
  'facts-computer': {
    title: 'Computer Facts',
    subtitle: 'Amazing Tech Facts',
    sectionTitle: 'Amazing Tech Facts',
    icon: 'cpu',
  },
  'facts-world': {
    title: 'World Facts',
    subtitle: 'Explore our amazing planet',
    sectionTitle: 'Wonders Around the World',
    icon: 'globe',
  },
  'facts-science': {
    title: 'Science Facts',
    subtitle: 'Discover how things work',
    sectionTitle: 'Amazing Science Facts',
    icon: 'flask',
  },
  'facts-surprise': {
    title: 'Surprising Facts',
    subtitle: 'Odd, true and memorable',
    sectionTitle: 'Facts You Won’t Expect',
    icon: 'zap',
  },
};

const CARD_ICONS: IconName[] = ['cpu', 'keyboard', 'globe', 'flask', 'zap'];
const CARD_VARIANTS: ClayVariant[] = ['blue', 'mint', 'orange', 'purple', 'red'];

function compactCount(value: number) {
  if (value < 1000) return String(value);
  const rounded = Math.round((value / 1000) * 10) / 10;
  return (Number.isInteger(rounded) ? rounded.toFixed(0) : rounded) + 'k';
}

function FactSeparator() {
  return <View style={styles.factSeparator} />;
}

function SaveAction({fact}: {fact: Fact}) {
  const save = useBookmark({kind: 'fact', id: fact.id});
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fact.bookmarked ? 'Fact is saved' : 'Save fact'}
      accessibilityState={{selected: fact.bookmarked}}
      hitSlop={8}
      onPress={event => {
        event.stopPropagation();
        save();
      }}
      style={({pressed}) => [styles.iconAction, pressed && styles.pressed]}>
      <Icon
        name="bookmark"
        size={14}
        color={fact.bookmarked ? colors.primary : '#A4ADBC'}
        filled={fact.bookmarked}
      />
    </Pressable>
  );
}

function FactArtwork({icon}: {icon: IconName}) {
  return (
    <View
      style={styles.factArt}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={styles.artGlow} />
      <View style={[styles.star, styles.starOne]} />
      <View style={[styles.star, styles.starTwo]} />
      <View style={[styles.star, styles.starThree]} />
      <Icon name={icon} size={35} color="#7EFFF9" strokeWidth={1.7} />
    </View>
  );
}

function FeaturedFact({
  fact,
  icon,
  reacting,
  onOpen,
  onReact,
  onQuiz,
}: {
  fact: Fact;
  icon: IconName;
  reacting: boolean;
  onOpen: () => void;
  onReact: () => void;
  onQuiz?: () => void;
}) {
  return (
    <ClayCard variant="cyan" padded={false} style={styles.featuredCard}>
      <FactArtwork icon={icon} />
      <View style={styles.featuredBody}>
        <View style={styles.featuredLabel}>
          <Icon name="bulb" size={13} color="#0288D1" />
          <AppText size={10} weight="900" color="#0288D1" style={styles.labelTracking}>
            FACT OF THE DAY
          </AppText>
        </View>
        <AppText weight="800" size={13} color={colors.navy} style={styles.featuredText}>
          {fact.text}
        </AppText>
        <View style={styles.featuredActions}>
          <ClayButton label="Read More" compact onPress={onOpen} />
          {onQuiz ? (
            <ClayButton label="Take a Quiz" tone="ghost" compact onPress={onQuiz} />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fact.reacted ? 'Unlike fact' : 'Like fact'}
            accessibilityState={{selected: fact.reacted, busy: reacting}}
            disabled={reacting}
            onPress={onReact}
            style={({pressed}) => [styles.heroAction, pressed && styles.pressed]}>
            <Icon name="heart" size={15} color="#E53935" filled={fact.reacted} />
          </Pressable>
          <SaveAction fact={fact} />
        </View>
      </View>
    </ClayCard>
  );
}

function FactListCard({
  fact,
  index,
  reacting,
  onOpen,
  onReact,
}: {
  fact: Fact;
  index: number;
  reacting: boolean;
  onOpen: () => void;
  onReact: () => void;
}) {
  const accent = clay[CARD_VARIANTS[index % CARD_VARIANTS.length]].icon;
  return (
    <ClayCard variant="white" padded={false} onPress={onOpen} style={styles.factCard}>
      <View style={styles.factNumberRow}>
        <Icon name={CARD_ICONS[index % CARD_ICONS.length]} size={15} color={accent} />
        <AppText face="mono" size={9.5} weight="800" color={accent} style={styles.labelTracking}>
          FACT #{String(index + 1).padStart(3, '0')}
        </AppText>
      </View>
      <AppText weight="700" size={12.5} color={colors.navy} style={styles.factText}>
        {fact.text}
      </AppText>
      <View style={styles.factFooter}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            fact.reactionCount +
            ' reactions. ' +
            (fact.reacted ? 'Unlike' : 'Like') +
            ' this fact'
          }
          accessibilityState={{selected: fact.reacted, busy: reacting}}
          disabled={reacting}
          hitSlop={8}
          onPress={event => {
            event.stopPropagation();
            onReact();
          }}
          style={({pressed}) => [styles.footerAction, pressed && styles.pressed]}>
          <Icon name="heart" size={13} color="#E53935" filled={fact.reacted} />
          <AppText size={10} weight="600" color={colors.text3}>
            {compactCount(fact.reactionCount)}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share fact"
          hitSlop={8}
          onPress={event => {
            event.stopPropagation();
            shareService.share(fact.text).catch(() => undefined);
          }}
          style={({pressed}) => [styles.footerAction, pressed && styles.pressed]}>
          <Icon name="share" size={13} color={colors.text3} />
          <AppText size={10} weight="600" color={colors.text3}>
            Share
          </AppText>
        </Pressable>
        <View style={styles.footerSpacer} />
        <SaveAction fact={fact} />
      </View>
    </ClayCard>
  );
}

export function FactsListScreen() {
  const navigation = useNavigation<HomeNav>();
  const params = (useRoute().params as FactsListParams | undefined) ?? {};
  const category = params.categoryId ? CATEGORY_DETAILS[params.categoryId] : undefined;
  const title = params.categoryTitle ?? category?.title ?? 'All Facts';
  const subtitle =
    params.categorySubtitle ?? category?.subtitle ?? 'Discover something new every day';
  const sectionTitle =
    category?.sectionTitle ??
    (params.categoryId ? 'Amazing ' + title : 'Explore Amazing Facts');
  const {facts, react} = useFactsList(params.categoryId);
  const allFacts = facts.data?.items ?? [];
  const featured = allFacts.find(item => item.featured) ?? allFacts[0];
  const listFacts = allFacts.filter(item => item.id !== featured?.id);
  const refresh = () => {
    facts.refetch().catch(() => undefined);
  };
  const pullRefresh = usePullRefreshFeedback({
    refreshing: facts.isRefetching && !facts.isFetchingNextPage,
    onRefresh: refresh,
  });

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title={title}
        subtitle={subtitle}
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            icon="bookmark"
            accessibilityLabel="Open saved facts"
            onPress={() => navigation.navigate('LearningTab', {screen: 'MyLearning'})}
          />
        }
        onShare={() => shareService.share(title + ' on RACI').catch(() => undefined)}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        data={listFacts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {facts.isLoading ? <LoadingBlock /> : null}
            {facts.isError ? (
              <ErrorState message="Facts could not load." onRetry={refresh} />
            ) : null}
            {!facts.isLoading && !facts.isError && !allFacts.length ? (
              <EmptyState
                title="No facts yet"
                body="Pull down to check again or explore another category."
                actionLabel="Go back"
                onAction={() => navigation.goBack()}
              />
            ) : null}
            {featured ? (
              <FeaturedFact
                fact={featured}
                icon={category?.icon ?? 'bulb'}
                reacting={react.isPending}
                onOpen={() => navigation.navigate('FactDetail', {factId: featured.id})}
                onReact={() => react.mutate({id: featured.id, reacted: !featured.reacted})}
                onQuiz={
                  featured.quizId
                    ? () => navigation.navigate('TestInstructions', {testId: featured.quizId!})
                    : undefined
                }
              />
            ) : null}
            {react.isError ? (
              <View style={styles.inlineError}>
                <Icon name="help" size={14} color={colors.error} />
                <AppText size={11} color={colors.error}>
                  {react.error.message}
                </AppText>
              </View>
            ) : null}
            {featured ? (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionCopy}>
                  <AppText weight="900" size={16} color={colors.navy}>
                    {sectionTitle}
                  </AppText>
                  <AppText size={10} color={colors.text3} style={styles.sectionSubtitle}>
                    {listFacts.length
                      ? listFacts.length + ' more to explore'
                      : 'More discoveries are on the way'}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Refresh facts"
                  disabled={facts.isFetching}
                  onPress={refresh}
                  hitSlop={8}
                  style={({pressed}) => [styles.refreshAction, pressed && styles.pressed]}>
                  <Icon name="refresh" size={13} color={colors.primary} />
                  <AppText size={11} weight="800" color={colors.primary}>
                    {facts.isRefetching ? 'Refreshing…' : 'Refresh'}
                  </AppText>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={FactSeparator}
        renderItem={({item, index}) => (
          <FactListCard
            fact={item}
            index={index}
            reacting={react.isPending}
            onOpen={() => navigation.navigate('FactDetail', {factId: item.id})}
            onReact={() => react.mutate({id: item.id, reacted: !item.reacted})}
          />
        )}
        ListFooterComponent={
          facts.hasNextPage ? (
            <View style={styles.loadMoreWrap}>
              <ClayButton
                label={facts.isFetchingNextPage ? 'Loading…' : 'Load More Facts'}
                icon="refresh"
                compact
                disabled={facts.isFetchingNextPage}
                onPress={() => facts.fetchNextPage().catch(() => undefined)}
                style={styles.loadMoreButton}
              />
            </View>
          ) : listFacts.length ? (
            <View style={styles.endNote}>
              <View style={styles.endLine} />
              <Icon name="bulb" size={14} color="#94A3B8" />
              <AppText size={10} weight="600" color="#94A3B8">
                You’re all caught up
              </AppText>
              <View style={styles.endLine} />
            </View>
          ) : undefined
        }
      />
    </Screen>
  );
}
