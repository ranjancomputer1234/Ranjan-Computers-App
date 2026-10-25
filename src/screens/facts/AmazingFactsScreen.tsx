import {createThemedStyles} from '../../theme';
import React, { useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { Icon, type IconName } from '../../assets/icons';
import { BrandedHeader, Screen } from '../../components/layout/Screen';
import {
  AppText,
  ClayButton,
  ClayCard,
  ClayIconTile,
  EmptyState,
  ErrorState,
  Gradient,
  LoadingBlock,
} from '../../components/ui';
import { useRepositories } from '../../core/di';
import { queryKeys } from '../../core/query';
import type { CatalogItem, Fact } from '../../core/types';
import { useBookmark } from '../../core/useBookmark';
import { useFactsList } from '../../features/facts';
import type { HomeNav } from '../../navigation/types';
import { virtualizedListPerformanceProps } from '../../components/layout/listPerformance';
import { clay, colors, radius, space } from '../../theme';
import { usePullRefreshFeedback } from '../../components/ui/AppRefreshControl';

function CategoryCard({
  item,
  onPress,
}: {
  item: CatalogItem;
  onPress: () => void;
}) {
  const locked = item.access.state !== 'granted';
  const tone = clay[item.clay];

  return (
    <ClayCard
      variant={item.clay}
      padded={false}
      onPress={onPress}
      style={styles.categoryCard}
    >
      <View style={styles.categoryTop}>
        <ClayIconTile
          icon={item.icon as IconName}
          color={item.iconColor ?? tone.icon}
          letter={item.letter}
          size={44}
        />
        <View
          style={[
            styles.accessBadge,
            locked ? styles.lockedBadge : styles.openBadge,
          ]}
        >
          <Icon
            name={locked ? 'lock' : 'chev'}
            size={12}
            color={locked ? colors.orange : tone.icon}
          />
        </View>
      </View>
      <View style={styles.categoryCopy}>
        <AppText weight="900" size={13.5} color={colors.navy} numberOfLines={2}>
          {item.title}
        </AppText>
        <AppText
          size={10}
          color={colors.text2}
          numberOfLines={2}
          style={styles.categorySubtitle}
        >
          {item.subtitle ?? 'A collection worth exploring'}
        </AppText>
      </View>
      <AppText
        size={9.5}
        weight="800"
        color={locked ? colors.orange : tone.icon}
      >
        {locked ? 'PREMIUM' : 'EXPLORE'}
      </AppText>
    </ClayCard>
  );
}

function FeaturedFact({
  fact,
  reacting,
  onOpen,
  onReact,
}: {
  fact: Fact;
  reacting: boolean;
  onOpen: () => void;
  onReact: () => void;
}) {
  const save = useBookmark({ kind: 'fact', id: fact.id });

  return (
    <Gradient
      colors={['#27104E', '#5B21B6', '#8B5CF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroGlowLarge} />
      <View style={styles.heroGlowSmall} />
      <View style={styles.heroArt}>
        <View style={styles.orbitOuter}>
          <View style={styles.orbitInner}>
            <Icon name="brain" size={40} color="#FFFFFF" strokeWidth={1.6} />
          </View>
          <View style={styles.sparkOne} />
          <View style={styles.sparkTwo} />
        </View>
      </View>
      <View style={styles.heroContent}>
        <View style={styles.eyebrowRow}>
          <View style={styles.liveDot} />
          <AppText
            size={9.5}
            weight="900"
            color="#EDE9FE"
            style={styles.eyebrow}
          >
            FACT OF THE DAY
          </AppText>
        </View>
        <AppText
          weight="900"
          size={20}
          color="#FFFFFF"
          style={styles.heroTitle}
        >
          {fact.text}
        </AppText>
        <AppText
          size={11}
          color="rgba(255,255,255,0.76)"
          numberOfLines={2}
          style={styles.heroBody}
        >
          {fact.explanation ??
            'Open this fact to discover the story behind it.'}
        </AppText>
        <View style={styles.heroActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpen}
            style={({ pressed }) => [
              styles.readButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText size={11.5} weight="900" color="#4C1D95">
              Discover why
            </AppText>
            <Icon name="chev" size={13} color="#4C1D95" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fact.reacted ? 'Unlike fact' : 'Like fact'}
            disabled={reacting}
            onPress={onReact}
            style={({ pressed }) => [
              styles.roundAction,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name="heart"
              size={15}
              color="#FFFFFF"
              filled={fact.reacted}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save fact"
            onPress={save}
            style={({ pressed }) => [
              styles.roundAction,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name="bookmark"
              size={15}
              color="#FFFFFF"
              filled={fact.bookmarked}
            />
          </Pressable>
        </View>
      </View>
    </Gradient>
  );
}

export function AmazingFactsScreen() {
  const navigation = useNavigation<HomeNav>();
  const repos = useRepositories();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.25 ? 1 : 2;
  const { facts, react } = useFactsList();
  const categories = useInfiniteQuery({
    queryKey: queryKeys.catalog('fact', { pricing: 'all' }),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      repos.catalog.list({ kind: 'fact', pricing: 'all', cursor: pageParam }),
    getNextPageParam: page => page.nextCursor ?? undefined,
  });
  const practice = useMutation({
    mutationFn: () => repos.assessments.dailyPractice('facts'),
    onSuccess: result =>
      navigation.navigate('TestInstructions', { testId: result.testId }),
    onError: () =>
      Alert.alert(
        'Quiz unavailable',
        'Please try the daily challenge again in a moment.',
      ),
  });

  const categoryItems = useMemo(
    () => categories.data?.pages.flatMap(page => page.items) ?? [],
    [categories.data],
  );
  const factItems = facts.data?.items ?? [];
  const featured = factItems.find(item => item.featured) ?? factItems[0];
  const totalReactions = factItems.reduce(
    (sum, item) => sum + item.reactionCount,
    0,
  );
  const savedCount = factItems.filter(item => item.bookmarked).length;

  const surpriseMe = () => {
    if (!factItems.length) return;
    const seed =
      new Date().getDate() + new Date().getMonth() + factItems.length;
    navigation.navigate('FactDetail', {
      factId: factItems[seed % factItems.length].id,
    });
  };

  const refresh = () => {
    Promise.all([facts.refetch(), categories.refetch()]).catch(() => undefined);
  };
  const pullRefresh = usePullRefreshFeedback({
    refreshing: facts.isRefetching || categories.isRefetching,
    onRefresh: refresh,
  });

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <BrandedHeader
        showBack
        onBack={() => navigation.goBack()}
        onSearch={() => navigation.navigate('Search', { query: 'facts' })}
        onNotifications={showLearnerUnavailable}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        key={columns}
        data={categoryItems}
        keyExtractor={item => item.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.categoryRow : undefined}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (categories.hasNextPage && !categories.isFetchingNextPage) {
            categories.fetchNextPage().catch(() => undefined);
          }
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View style={styles.flex}>
                <AppText weight="900" size={24} color={colors.navy}>
                  Amazing Facts
                </AppText>
                <AppText size={12} color={colors.text2} style={styles.subtitle}>
                  Tiny discoveries. Big conversation starters.
                </AppText>
              </View>
              <View style={styles.curiosityBadge}>
                <Icon name="bulb" size={14} color="#B45309" />
                <AppText size={10} weight="900" color="#92400E">
                  CURIOUS
                </AppText>
              </View>
            </View>

            {facts.isError ? (
              <ErrorState
                message="Today's facts could not be loaded."
                onRetry={() => facts.refetch()}
              />
            ) : facts.isLoading ? (
              <View style={styles.heroLoading}>
                <LoadingBlock />
              </View>
            ) : featured ? (
              <FeaturedFact
                fact={featured}
                reacting={react.isPending}
                onOpen={() =>
                  navigation.navigate('FactDetail', { factId: featured.id })
                }
                onReact={() =>
                  react.mutate({ id: featured.id, reacted: !featured.reacted })
                }
              />
            ) : (
              <EmptyState
                title="No daily fact yet"
                body="Pull down to check again."
              />
            )}

            {react.isError ? (
              <AppText size={11} color={colors.error}>
                {react.error.message}
              </AppText>
            ) : null}

            <View style={styles.quickRow}>
              <ClayCard
                variant="orange"
                padded={false}
                onPress={surpriseMe}
                style={styles.quickCard}
              >
                <View style={[styles.quickIcon, styles.surpriseIcon]}>
                  <Icon name="refresh" size={17} color={colors.orange} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="900" size={12} color={colors.navy}>
                    Surprise me
                  </AppText>
                  <AppText size={9.5} color={colors.text2}>
                    Open a random fact
                  </AppText>
                </View>
              </ClayCard>
              <ClayCard
                variant="green"
                padded={false}
                onPress={() => practice.mutate()}
                style={styles.quickCard}
              >
                <View style={[styles.quickIcon, styles.quizIcon]}>
                  <Icon name="trophy" size={17} color={colors.success} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="900" size={12} color={colors.navy}>
                    {practice.isPending ? 'Preparing…' : 'Quick quiz'}
                  </AppText>
                  <AppText size={9.5} color={colors.text2}>
                    Test today&apos;s recall
                  </AppText>
                </View>
              </ClayCard>
            </View>

            {factItems.length ? (
              <View style={styles.statsCard}>
                <View style={styles.stat}>
                  <Icon name="bulb" size={16} color="#7C3AED" />
                  <View>
                    <AppText weight="900" size={13.5} color={colors.navy}>
                      {factItems.length}
                    </AppText>
                    <AppText size={9.5} color={colors.text3}>
                      ready to read
                    </AppText>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                  <Icon name="heart" size={16} color="#DB2777" />
                  <View>
                    <AppText weight="900" size={13.5} color={colors.navy}>
                      {totalReactions}
                    </AppText>
                    <AppText size={9.5} color={colors.text3}>
                      community likes
                    </AppText>
                  </View>
                </View>
                <View style={styles.divider} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate('LearningTab', { screen: 'MyLearning' })
                  }
                  style={({ pressed }) => [
                    styles.stat,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    name="bookmark"
                    size={16}
                    color={colors.primary}
                    filled={savedCount > 0}
                  />
                  <View>
                    <AppText weight="900" size={13.5} color={colors.navy}>
                      {savedCount}
                    </AppText>
                    <AppText size={9.5} color={colors.text3}>
                      saved here
                    </AppText>
                  </View>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.sectionRow}>
              <View>
                <AppText weight="900" size={17} color={colors.navy}>
                  Pick your curiosity
                </AppText>
                <AppText
                  size={10.5}
                  color={colors.text3}
                  style={styles.sectionHint}
                >
                  Explore by subject or browse everything
                </AppText>
              </View>
              <Pressable
                onPress={() => navigation.navigate('FactsList')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.allButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText size={11} weight="900" color={colors.primary}>
                  View all
                </AppText>
                <Icon name="chev" size={12} color={colors.primary} />
              </Pressable>
            </View>

            {categories.isError ? (
              <ErrorState
                message="Fact categories could not be loaded."
                onRetry={() => categories.refetch()}
              />
            ) : null}
            {categories.isLoading ? <LoadingBlock /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.categoryCell}>
            <CategoryCard
              item={item}
              onPress={() =>
                navigation.navigate('FactsList', {
                  categoryId: item.id,
                  categoryTitle: item.title,
                  categorySubtitle: item.subtitle,
                })
              }
            />
          </View>
        )}
        ListFooterComponent={
          categories.isFetchingNextPage ? (
            <LoadingBlock />
          ) : categoryItems.length ? (
            <ClayButton
              label="Browse all facts"
              tone="ghost"
              icon="bookopen"
              onPress={() => navigation.navigate('FactsList')}
              style={styles.footerButton}
            />
          ) : undefined
        }
        ListEmptyComponent={
          !categories.isLoading && !categories.isError ? (
            <EmptyState
              title="No categories yet"
              body="You can still browse every available fact."
              actionLabel="Browse all facts"
              onAction={() => navigation.navigate('FactsList')}
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = createThemedStyles({
  page: { paddingHorizontal: space.pageX, paddingTop: 16, paddingBottom: 28 },
  headerContent: { gap: 15, marginBottom: 13 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 5 },
  curiosityBadge: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroLoading: { minHeight: 230, justifyContent: 'center' },
  hero: {
    minHeight: 250,
    borderRadius: 25,
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    boxShadow: '0 18px 30px -18px rgba(76,29,149,0.8)',
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -82,
    top: -90,
    backgroundColor: 'rgba(196,181,253,0.13)',
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    left: -55,
    bottom: -55,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroArt: { position: 'absolute', right: 19, top: 17 },
  orbitOuter: {
    width: 91,
    height: 91,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
  },
  orbitInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkOne: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FDE68A',
    top: 6,
    right: 10,
  },
  sparkTwo: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    left: 2,
    bottom: 19,
  },
  heroContent: { zIndex: 2, maxWidth: '96%' },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FDE68A' },
  eyebrow: { letterSpacing: 1.1 },
  heroTitle: { lineHeight: 27, maxWidth: '86%' },
  heroBody: { lineHeight: 16.5, marginTop: 7, maxWidth: '88%' },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  readButton: {
    minHeight: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
  },
  roundAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.78 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    minHeight: 68,
    borderRadius: radius.card,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.progressTrack,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 31,
    backgroundColor: colors.progressTrack,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  sectionHint: { marginTop: 3 },
  allButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  categoryRow: { gap: 11 },
  categoryCell: { flex: 1, minWidth: 0, marginBottom: 11 },
  categoryCard: { minHeight: 158, padding: 12, gap: 10 },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  accessBadge: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadge: { backgroundColor: '#FFF3E0' },
  openBadge: { backgroundColor: '#FFFFFF' },
  categoryCopy: { flex: 1 },
  categorySubtitle: { lineHeight: 14, marginTop: 5 },
  footerButton: { marginTop: 3 },
  surpriseIcon: { backgroundColor: '#FFF7ED' },
  quizIcon: { backgroundColor: '#F0FDF4' },
});
