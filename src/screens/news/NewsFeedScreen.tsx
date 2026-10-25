import {createThemedStyles} from '../../theme';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import { useQuery } from '@tanstack/react-query';
import { Icon, type IconName } from '../../assets/icons';
import { DetailHeader, Screen } from '../../components/layout/Screen';
import {
  AppText,
  ClayButton,
  EmptyState,
  ErrorState,
  Gradient,
  LoadingBlock,
  SearchInput,
} from '../../components/ui';
import { useRepositories } from '../../core/di';
import { queryKeys } from '../../core/query';
import type { CatalogItem, NewsArticle } from '../../core/types';
import { useBookmark } from '../../core/useBookmark';
import { useNewsFeed } from '../../features/news/hooks/useNewsFeed';
import type { HomeNav } from '../../navigation/types';
import { clay, clayShadow, radius, space } from '../../theme';
import { useColors } from '../../theme/ThemeProvider';
import { virtualizedListPerformanceProps } from '../../components/layout/listPerformance';
import { usePullRefreshFeedback } from '../../components/ui/AppRefreshControl';

type FeedFilter = 'latest' | 'quick' | 'free';

const storyArt: Partial<Record<IconName, readonly [string, string]>> = {
  bank: ['#0D47A1', '#1565C0'],
  trophy: ['#E65100', '#FB8C00'],
  chakra: ['#1A237E', '#303F9F'],
  atom: ['#00695C', '#00897B'],
  chart: ['#4527A0', '#7B1FA2'],
};

function shortCategory(title?: string) {
  return (title ?? 'News').replace(/ News$/i, '');
}

function todayLabel() {
  return `Today · ${new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
}

function timeAgo(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function storyIcon(article: NewsArticle, fallback?: IconName): IconName {
  const words = `${article.title} ${(article.tags ?? []).join(
    ' ',
  )}`.toLowerCase();
  if (/rbi|bank|repo|ibps/.test(words)) return 'bank';
  if (/sport|game|medal|cricket/.test(words)) return 'trophy';
  if (/parliament|government|governance/.test(words)) return 'chakra';
  if (/science|tech|isro|rocket|space/.test(words)) return 'atom';
  if (/business|startup|funding|market/.test(words)) return 'chart';
  return fallback ?? 'news';
}

function storyLabel(article: NewsArticle, category?: CatalogItem) {
  return article.tags?.[0] ?? shortCategory(category?.title);
}

function SaveButton({ article }: { article: NewsArticle }) {
  const colors = useColors();
  const save = useBookmark({ kind: 'news', id: article.id });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Save ${article.title}`}
      hitSlop={10}
      onPress={(event: GestureResponderEvent) => {
        event.stopPropagation();
        save();
      }}
      style={({ pressed }) => [
        styles.saveButton,
        { backgroundColor: colors.subtle, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Icon name="bookmark" size={14} color={colors.primary} />
    </Pressable>
  );
}

function FeaturedStory({
  article,
  category,
  onPress,
}: {
  article: NewsArticle;
  category?: CatalogItem;
  onPress: () => void;
}) {
  const colors = useColors();
  const icon = storyIcon(article, category?.icon as IconName | undefined);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read top story: ${article.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.featured,
        { opacity: pressed ? 0.94 : 1 },
      ]}
    >
      <Gradient
        colors={['#0D47A1', '#1976D2', '#42A5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featuredArt}
      >
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessible
            accessibilityLabel={`Artwork for ${article.title}`}
          />
        ) : null}
        {article.imageUrl ? <View style={styles.imageScrim} /> : null}
        <View style={styles.heroGlow} />
        {!article.imageUrl ? (
          <Icon name={icon} size={64} color="rgba(255,255,255,0.92)" />
        ) : null}
        <View style={styles.topStoryPill}>
          <AppText
            weight="800"
            size={9}
            color="#FFFFFF"
            style={styles.tracking}
          >
            TOP STORY
          </AppText>
        </View>
        <View style={styles.heroSave}>
          <SaveButton article={article} />
        </View>
      </Gradient>
      <View style={[styles.featuredBody, { backgroundColor: colors.white }]}>
        <View style={styles.metaRow}>
          <View
            style={[styles.categoryPill, { backgroundColor: clay.green.bg }]}
          >
            <AppText weight="800" size={8.5} color={clay.green.icon}>
              {storyLabel(article, category).toUpperCase()}
            </AppText>
          </View>
          <AppText size={9.5} color={colors.text3}>
            {article.readingMinutes ?? 3} min read
          </AppText>
        </View>
        <AppText
          weight="800"
          size={15}
          color={colors.navy}
          style={styles.featuredTitle}
        >
          {article.title}
        </AppText>
        <View style={styles.metaRow}>
          <AppText size={10} color={colors.text3}>
            {article.byline ?? 'RACI News Desk'}
          </AppText>
          <View style={[styles.dot, { backgroundColor: colors.text3 }]} />
          <AppText size={10} color={colors.text3}>
            {timeAgo(article.publishedAt)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function HeadlineCard({
  article,
  category,
  onPress,
}: {
  article: NewsArticle;
  category?: CatalogItem;
  onPress: () => void;
}) {
  const colors = useColors();
  const icon = storyIcon(article, category?.icon as IconName | undefined);
  const gradient = storyArt[icon] ?? ['#0D47A1', '#1976D2'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read headline: ${article.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headlineCard,
        {
          backgroundColor: colors.white,
          borderColor: colors.progressTrack,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Gradient colors={gradient} style={styles.thumbnail}>
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Icon name={icon} size={25} color="#FFFFFF" />
        )}
        {article.access.state !== 'granted' ? (
          <View style={styles.lockBadge}>
            <Icon name="lock" size={8} color="#FFFFFF" />
          </View>
        ) : null}
      </Gradient>
      <View style={styles.headlineBody}>
        <AppText
          weight="800"
          size={12.5}
          color={colors.navy}
          numberOfLines={2}
          style={styles.headlineTitle}
        >
          {article.title}
        </AppText>
        <View style={styles.metaRow}>
          <AppText
            size={9.5}
            color={colors.text3}
            numberOfLines={1}
            style={styles.flex}
          >
            {storyLabel(article, category)} · {timeAgo(article.publishedAt)}
          </AppText>
          <AppText size={9.5} color={colors.text3}>
            {article.readingMinutes ?? 3} min
          </AppText>
        </View>
      </View>
      <SaveButton article={article} />
      <Icon name="chev" size={14} color={colors.text3} />
    </Pressable>
  );
}

function FilterButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primary : colors.subtle,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <AppText
        weight="700"
        size={10.5}
        color={selected ? '#FFFFFF' : colors.navy}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function NewsFeedScreen() {
  const navigation = useNavigation<HomeNav>();
  const categoryId = (useRoute().params as { categoryId: string }).categoryId;
  const colors = useColors();
  const repos = useRepositories();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>('latest');
  const [search, setSearch] = useState('');
  const feed = useNewsFeed(categoryId);
  const category = useQuery({
    queryKey: queryKeys.catalog('news', { categoryId }),
    queryFn: async () => {
      let cursor: string | undefined;
      do {
        const page = await repos.catalog.list({
          kind: 'news',
          pricing: 'all',
          cursor,
        });
        const match = page.items.find(item => item.id === categoryId);
        if (match) return match;
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      return undefined;
    },
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: feed.isRefetching || category.isRefetching,
    onRefresh: () => {
      Promise.all([feed.refetch(), category.refetch()]).catch(
        () => undefined,
      );
    },
  });

  const stories = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return [...(feed.data?.items ?? [])]
      .filter(item => {
        if (filter === 'quick' && (item.readingMinutes ?? 3) > 3) return false;
        if (filter === 'free' && item.access.state !== 'granted') return false;
        if (!normalized) return true;
        return [item.title, item.excerpt, item.byline, ...(item.tags ?? [])]
          .filter(Boolean)
          .some(value => value?.toLocaleLowerCase().includes(normalized));
      })
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }, [feed.data, filter, search]);

  const featured = stories.find(item => item.featured) ?? stories[0];
  const headlines = featured
    ? stories.filter(item => item.id !== featured.id)
    : stories;
  const openArticle = (articleId: string) =>
    navigation.navigate('NewsArticle', { articleId });

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title={category.data?.title ?? 'News'}
        subtitle="Daily News · Stay Updated"
        onBack={() => navigation.goBack()}
        onFilter={() => setFiltersVisible(value => !value)}
        onNotifications={showLearnerUnavailable}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        data={headlines}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HeadlineCard
            article={item}
            category={category.data}
            onPress={() => openArticle(item.id)}
          />
        )}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage)
            feed.fetchNextPage().catch(() => undefined);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View
              style={[
                styles.dateStrip,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.progressTrack,
                },
              ]}
            >
              <Icon name="caltick" size={17} color={colors.orange} />
              <AppText
                weight="800"
                size={11.5}
                color={colors.navy}
                style={styles.flex}
              >
                {todayLabel()}
              </AppText>
              <View
                style={[
                  styles.languagePill,
                  { backgroundColor: colors.pastel.blue },
                ]}
              >
                <AppText weight="800" size={9} color={colors.primary}>
                  EN
                </AppText>
              </View>
            </View>

            {filtersVisible ? (
              <View
                style={[
                  styles.filterPanel,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.progressTrack,
                  },
                ]}
              >
                <SearchInput
                  placeholder="Search this news feed"
                  value={search}
                  onChangeText={setSearch}
                  onClear={() => setSearch('')}
                />
                <View style={styles.filterRow}>
                  <FilterButton
                    label="Latest"
                    selected={filter === 'latest'}
                    onPress={() => setFilter('latest')}
                  />
                  <FilterButton
                    label="Quick reads"
                    selected={filter === 'quick'}
                    onPress={() => setFilter('quick')}
                  />
                  <FilterButton
                    label="Free access"
                    selected={filter === 'free'}
                    onPress={() => setFilter('free')}
                  />
                </View>
              </View>
            ) : null}

            {feed.isError ? (
              <ErrorState
                message="No stories could be loaded."
                onRetry={() => feed.refetch()}
              />
            ) : feed.isLoading ? (
              <View style={styles.loading}>
                <LoadingBlock />
              </View>
            ) : featured ? (
              <FeaturedStory
                article={featured}
                category={category.data}
                onPress={() => openArticle(featured.id)}
              />
            ) : null}

            {stories.length > 1 ? (
              <View style={styles.sectionHeading}>
                <View>
                  <AppText weight="900" size={17} color={colors.navy}>
                    Latest Headlines
                  </AppText>
                  <AppText
                    size={10}
                    color={colors.text3}
                    style={styles.headingSubtext}
                  >
                    {filter === 'latest'
                      ? 'Newest updates first'
                      : filter === 'quick'
                      ? 'Read in 3 minutes or less'
                      : 'Available without purchase'}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.resultPill,
                    { backgroundColor: colors.pastel.blue },
                  ]}
                >
                  <AppText weight="800" size={9.5} color={colors.primary}>
                    {headlines.length} STORIES
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !feed.isLoading && !feed.isError && !featured ? (
            <EmptyState
              title={
                search || filter !== 'latest'
                  ? 'No matching headlines'
                  : 'No stories yet'
              }
              body={
                search || filter !== 'latest'
                  ? 'Try clearing the search or changing the filter.'
                  : 'Check back soon for updates in this category.'
              }
              actionLabel={
                search || filter !== 'latest' ? 'Reset filters' : undefined
              }
              onAction={() => {
                setSearch('');
                setFilter('latest');
              }}
            />
          ) : undefined
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <LoadingBlock />
          ) : feed.hasNextPage ? (
            <View style={styles.loadMore}>
              <ClayButton
                label="Load More Stories"
                tone="ghost"
                compact
                onPress={() => feed.fetchNextPage().catch(() => undefined)}
              />
            </View>
          ) : headlines.length ? (
            <View style={styles.endMarker}>
              <View
                style={[
                  styles.endLine,
                  { backgroundColor: colors.progressTrack },
                ]}
              />
              <AppText weight="700" size={9.5} color={colors.text3}>
                YOU’RE ALL CAUGHT UP
              </AppText>
              <View
                style={[
                  styles.endLine,
                  { backgroundColor: colors.progressTrack },
                ]}
              />
            </View>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
      />
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {
    paddingHorizontal: space.pageX,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 10,
  },
  headerContent: { gap: 14, marginBottom: 2 },
  flex: { flex: 1, minWidth: 0 },
  dateStrip: {
    minHeight: 47,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 14px 24px -18px rgba(26,35,126,0.4)',
  },
  languagePill: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999 },
  filterPanel: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 11,
    gap: 10,
    boxShadow: '0 14px 24px -18px rgba(26,35,126,0.4)',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  loading: { minHeight: 210, justifyContent: 'center' },
  featured: {
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: clayShadow('white'),
  },
  featuredArt: {
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageScrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(5,20,48,0.30)',
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -68,
    top: -92,
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
  topStoryPill: {
    position: 'absolute',
    left: 11,
    bottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(13,27,62,0.58)',
  },
  tracking: { letterSpacing: 1.2 },
  heroSave: { position: 'absolute', top: 10, right: 10 },
  featuredBody: { paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  featuredTitle: { lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryPill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  dot: { width: 3, height: 3, borderRadius: 2, opacity: 0.65 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  headingSubtext: { marginTop: 3 },
  resultPill: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999 },
  headlineCard: {
    minHeight: 86,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 14px 24px -18px rgba(26,35,126,0.46)',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(13,27,62,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineBody: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headlineTitle: { lineHeight: 17 },
  saveButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMore: { alignItems: 'center', paddingTop: 10 },
  endMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  endLine: { height: StyleSheet.hairlineWidth, flex: 1 },
  footerSpace: { height: 18 },
});
