import {createThemedStyles} from '../../theme';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Icon, type IconName } from '../../assets/icons';
import { DetailHeader, Screen } from '../../components/layout/Screen';
import {
  AppText,
  EmptyState,
  ErrorState,
  Gradient,
  LoadingBlock,
  SearchInput,
} from '../../components/ui';
import { clay, radius, space } from '../../theme';
import { useColors } from '../../theme/ThemeProvider';
import { useRepositories } from '../../core/di';
import { queryKeys } from '../../core/query';
import { useBookmark } from '../../core/useBookmark';
import { useNewsFeed } from '../../features/news/hooks/useNewsFeed';
import type { CatalogItem, NewsArticle } from '../../core/types';
import type { HomeNav } from '../../navigation/types';
import { virtualizedListPerformanceProps } from '../../components/layout/listPerformance';
import { usePullRefreshFeedback } from '../../components/ui/AppRefreshControl';

const ALL_NEWS = 'all';

function shortCategory(title?: string) {
  return (title ?? 'News').replace(/ News$/i, '');
}

function readableDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function longDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function TopicChip({
  item,
  selected,
  onPress,
}: {
  item?: CatalogItem;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const tint = item ? clay[item.clay] : clay.blue;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.topicChip,
        {
          backgroundColor: selected ? colors.navy : tint.bg,
          borderColor: selected ? colors.navy : 'transparent',
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Icon
        name={(item?.icon ?? 'news') as IconName}
        size={14}
        color={selected ? '#FFFFFF' : tint.icon}
      />
      <AppText
        weight="700"
        size={11.5}
        color={selected ? '#FFFFFF' : colors.navy}
      >
        {item ? shortCategory(item.title) : 'Top stories'}
      </AppText>
      {item?.pricing === 'paid' ? (
        <Icon name="lock" size={10} color={selected ? '#FFFFFF' : tint.icon} />
      ) : null}
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read top story: ${article.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.heroPress,
        { opacity: pressed ? 0.95 : 1 },
      ]}
    >
      <Gradient
        colors={['#071B46', '#0D47A1', '#1976D2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
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
          <View style={styles.heroOrb}>
            <Icon
              name={(category?.icon ?? 'news') as IconName}
              size={38}
              color="rgba(255,255,255,0.92)"
            />
          </View>
        ) : null}
        <View style={styles.heroCopy}>
          <View style={styles.eyebrowRow}>
            <View style={styles.liveDot} />
            <AppText
              weight="800"
              size={9}
              color="#FFFFFF"
              style={styles.eyebrow}
            >
              TOP STORY
            </AppText>
            <View style={styles.heroCategory}>
              <AppText weight="700" size={9} color="#FFFFFF">
                {shortCategory(category?.title)}
              </AppText>
            </View>
          </View>
          <AppText
            weight="900"
            size={21}
            color="#FFFFFF"
            numberOfLines={3}
            style={styles.heroTitle}
          >
            {article.title}
          </AppText>
          {article.excerpt ? (
            <AppText
              size={11.5}
              color="rgba(255,255,255,0.78)"
              numberOfLines={2}
              style={styles.heroExcerpt}
            >
              {article.excerpt}
            </AppText>
          ) : null}
          <View style={styles.heroMeta}>
            <Icon name="clock" size={13} color="rgba(255,255,255,0.8)" />
            <AppText size={10.5} color="rgba(255,255,255,0.8)">
              {article.readingMinutes ?? 3} min read
            </AppText>
            <View style={styles.metaDot} />
            <AppText size={10.5} color="rgba(255,255,255,0.8)">
              {readableDate(article.publishedAt)}
            </AppText>
            <View style={styles.readArrow}>
              <Icon name="chev" size={15} color={colors.deepBlue} />
            </View>
          </View>
        </View>
      </Gradient>
    </Pressable>
  );
}

function StoryCard({
  article,
  category,
  onPress,
}: {
  article: NewsArticle;
  category?: CatalogItem;
  onPress: () => void;
}) {
  const colors = useColors();
  const save = useBookmark({ kind: 'news', id: article.id });
  const tint = clay[article.imageTint];
  const locked = article.access.state !== 'granted';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read story: ${article.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.story,
        {
          backgroundColor: colors.white,
          borderColor: colors.progressTrack,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.storyVisual, { backgroundColor: tint.bg }]}>
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <>
            <View
              style={[styles.storyVisualHalo, { borderColor: tint.icon }]}
            />
            <Icon
              name={(category?.icon ?? 'news') as IconName}
              size={25}
              color={tint.icon}
            />
          </>
        )}
        {locked ? (
          <View style={styles.lockBadge}>
            <Icon name="lock" size={9} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <View style={styles.storyCopy}>
        <View style={styles.storyTopline}>
          <AppText weight="800" size={9} color={tint.icon} numberOfLines={1}>
            {shortCategory(category?.title).toUpperCase()}
          </AppText>
          <AppText size={9.5} color={colors.text3}>
            {readableDate(article.publishedAt)}
          </AppText>
        </View>
        <AppText
          weight="800"
          size={13.5}
          color={colors.navy}
          numberOfLines={2}
          style={styles.storyTitle}
        >
          {article.title}
        </AppText>
        <View style={styles.storyBottomline}>
          <AppText
            size={10.5}
            color={colors.text2}
            numberOfLines={1}
            style={styles.flex}
          >
            {article.byline ?? 'RACI News'} · {article.readingMinutes ?? 3} min
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Save ${article.title}`}
            hitSlop={10}
            onPress={event => {
              event.stopPropagation();
              save();
            }}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: colors.subtle, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Icon name="bookmark" size={14} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export function DailyNewsScreen() {
  const navigation = useNavigation<HomeNav>();
  const colors = useColors();
  const repos = useRepositories();
  const [selectedCategory, setSelectedCategory] = useState(ALL_NEWS);
  const [search, setSearch] = useState('');
  const categoryId =
    selectedCategory === ALL_NEWS ? undefined : selectedCategory;
  const feed = useNewsFeed(categoryId);
  const categories = useInfiniteQuery({
    queryKey: queryKeys.catalog('news', { pricing: 'all' }),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      repos.catalog.list({ kind: 'news', pricing: 'all', cursor: pageParam }),
    getNextPageParam: page => page.nextCursor ?? undefined,
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: feed.isRefetching || categories.isRefetching,
    onRefresh: () => {
      Promise.all([feed.refetch(), categories.refetch()]).catch(
        () => undefined,
      );
    },
  });

  const categoryItems = useMemo(
    () => categories.data?.pages.flatMap(page => page.items) ?? [],
    [categories.data],
  );
  const categoryMap = useMemo(
    () => new Map(categoryItems.map(item => [item.id, item])),
    [categoryItems],
  );
  const stories = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    const items = feed.data?.items ?? [];
    if (!normalized) return items;
    return items.filter(item =>
      [item.title, item.excerpt, item.byline, ...(item.tags ?? [])]
        .filter(Boolean)
        .some(value => value?.toLocaleLowerCase().includes(normalized)),
    );
  }, [feed.data, search]);
  const featured = stories.find(item => item.featured) ?? stories[0];
  const listStories = featured
    ? stories.filter(item => item.id !== featured.id)
    : stories;
  const readMinutes = stories.reduce(
    (total, item) => total + (item.readingMinutes ?? 3),
    0,
  );

  const openArticle = (articleId: string) =>
    navigation.navigate('NewsArticle', { articleId });

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Daily News"
        subtitle="Brief, relevant, exam-ready"
        onBack={() => navigation.goBack()}
        onNotifications={showLearnerUnavailable}
      />
      <FlatList
        {...pullRefresh.scrollProps}
        {...virtualizedListPerformanceProps}
        data={listStories}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <StoryCard
            article={item}
            category={categoryMap.get(item.categoryId)}
            onPress={() => openArticle(item.id)}
          />
        )}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage().catch(() => undefined);
          }
        }}
        onEndReachedThreshold={0.45}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <LoadingBlock />
          ) : (
            <View style={styles.footerSpace} />
          )
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View style={styles.flex}>
                <AppText weight="900" size={24} color={colors.navy}>
                  Your daily briefing
                </AppText>
                <AppText
                  size={11.5}
                  color={colors.text2}
                  style={styles.dateText}
                >
                  {longDate()}
                </AppText>
              </View>
              <View
                style={[
                  styles.editionBadge,
                  { backgroundColor: colors.pastel.orange },
                ]}
              >
                <Icon name="zap" size={12} color={colors.orange} />
                <AppText weight="800" size={9.5} color={colors.orange}>
                  LATEST
                </AppText>
              </View>
            </View>

            <SearchInput
              placeholder="Search headlines, topics or tags"
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topics}
            >
              <TopicChip
                selected={selectedCategory === ALL_NEWS}
                onPress={() => setSelectedCategory(ALL_NEWS)}
              />
              {categoryItems.map(item => (
                <TopicChip
                  key={item.id}
                  item={item}
                  selected={selectedCategory === item.id}
                  onPress={() => setSelectedCategory(item.id)}
                />
              ))}
            </ScrollView>

            {feed.isError ? (
              <ErrorState
                message="Today's briefing could not be loaded."
                onRetry={() => feed.refetch()}
              />
            ) : feed.isLoading ? (
              <View style={styles.loading}>
                <LoadingBlock />
              </View>
            ) : featured ? (
              <FeaturedStory
                article={featured}
                category={categoryMap.get(featured.categoryId)}
                onPress={() => openArticle(featured.id)}
              />
            ) : null}

            {stories.length ? (
              <View
                style={[
                  styles.briefStats,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.progressTrack,
                  },
                ]}
              >
                <View style={styles.statItem}>
                  <Icon name="news" size={16} color={colors.primary} />
                  <View>
                    <AppText weight="900" size={13} color={colors.navy}>
                      {stories.length}
                    </AppText>
                    <AppText size={9.5} color={colors.text3}>
                      stories
                    </AppText>
                  </View>
                </View>
                <View
                  style={[
                    styles.statDivider,
                    { backgroundColor: colors.progressTrack },
                  ]}
                />
                <View style={styles.statItem}>
                  <Icon name="clock" size={16} color={colors.success} />
                  <View>
                    <AppText weight="900" size={13} color={colors.navy}>
                      {readMinutes} min
                    </AppText>
                    <AppText size={9.5} color={colors.text3}>
                      full briefing
                    </AppText>
                  </View>
                </View>
                <View
                  style={[
                    styles.statDivider,
                    { backgroundColor: colors.progressTrack },
                  ]}
                />
                <View style={styles.statItem}>
                  <Icon name="bookmark" size={16} color={colors.orange} />
                  <View>
                    <AppText weight="900" size={13} color={colors.navy}>
                      Save
                    </AppText>
                    <AppText size={9.5} color={colors.text3}>
                      read later
                    </AppText>
                  </View>
                </View>
              </View>
            ) : null}

            {stories.length > 1 ? (
              <View style={styles.sectionHeading}>
                <View>
                  <AppText weight="900" size={17} color={colors.navy}>
                    More to know
                  </AppText>
                  <AppText
                    size={10.5}
                    color={colors.text3}
                    style={styles.dateText}
                  >
                    Selected for focused daily learning
                  </AppText>
                </View>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: colors.pastel.blue },
                  ]}
                >
                  <AppText weight="800" size={10} color={colors.primary}>
                    {listStories.length} MORE
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !feed.isLoading && !feed.isError && stories.length === 0 ? (
            <EmptyState
              title={
                search ? 'No matching headlines' : 'No stories in this topic'
              }
              body={
                search
                  ? 'Try a broader word or clear your search.'
                  : 'Choose another topic or pull down to refresh.'
              }
              actionLabel={search ? 'Clear search' : 'Show top stories'}
              onAction={() => {
                setSearch('');
                setSelectedCategory(ALL_NEWS);
              }}
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {
    paddingHorizontal: space.pageX,
    paddingTop: 16,
    gap: 12,
  },
  headerContent: { gap: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  dateText: { marginTop: 4 },
  editionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  topics: { gap: 8, paddingRight: 8 },
  topicChip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loading: { minHeight: 170, justifyContent: 'center' },
  heroPress: { borderRadius: radius.hero },
  hero: {
    minHeight: 230,
    borderRadius: radius.hero,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'flex-end',
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -72,
    top: -84,
    backgroundColor: 'rgba(77,171,247,0.22)',
  },
  imageScrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(4,18,48,0.56)',
  },
  heroOrb: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    right: 18,
    top: 18,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
  },
  heroCopy: { maxWidth: '92%' },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69F0AE' },
  eyebrow: { letterSpacing: 1.3 },
  heroCategory: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroTitle: { lineHeight: 27 },
  heroExcerpt: { lineHeight: 17, marginTop: 7 },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 13,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  readArrow: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefStats: {
    minHeight: 66,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  countPill: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999 },
  story: {
    minHeight: 126,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 11,
    flexDirection: 'row',
    gap: 12,
    boxShadow: '0 10px 22px -18px rgba(26,35,126,0.55)',
  },
  storyVisual: {
    width: 86,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyVisualHalo: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 13,
    opacity: 0.09,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#F57C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  storyTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  storyTitle: { lineHeight: 19, marginVertical: 5 },
  storyBottomline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSpace: { height: 22 },
});
