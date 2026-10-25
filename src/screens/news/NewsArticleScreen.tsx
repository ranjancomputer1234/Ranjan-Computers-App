import React, { useEffect, useMemo, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon, type IconName } from '../../assets/icons';
import { useBookmark } from '../../core/useBookmark';
import { isAuthenticated, useSessionStore } from '../../core/session';
import { shareService } from '../../core/services';
import {
  ClayButton,
  ClayCard,
  AppText,
  ErrorState,
  Gradient,
  LoadingBlock,
} from '../../components/ui';
import { Screen } from '../../components/layout/Screen';
import { clay, gradients } from '../../theme';
import { useColors } from '../../theme/ThemeProvider';
import type { NewsArticle } from '../../core/types';
import type { HomeNav } from '../../navigation/types';
import { useNewsArticle } from '../../features/news/hooks/useNewsArticle';
import { useNewsFeed } from '../../features/news/hooks/useNewsFeed';
import { styles } from './styles';
import { usePullRefreshFeedback } from '../../components/ui/AppRefreshControl';

const TEXT_SIZES = [12.5, 14, 15.5] as const;

function categoryDetails(categoryId: string) {
  const categories: Record<string, { label: string; icon: IconName }> = {
    'news-national': { label: 'National', icon: 'india' },
    'news-international': { label: 'International', icon: 'globe' },
    'news-state': { label: 'State', icon: 'map' },
    'news-sports': { label: 'Sports', icon: 'trophy' },
    'news-banking': { label: 'Banking', icon: 'bank' },
    'news-business': { label: 'Business & Finance', icon: 'chart' },
    'news-science': { label: 'Science & Tech', icon: 'atom' },
  };
  return (
    categories[categoryId] ?? { label: 'Daily News', icon: 'news' as IconName }
  );
}

function publishedLabel(value: string) {
  const published = new Date(value);
  if (Number.isNaN(published.getTime())) return '';
  const elapsed = Date.now() - published.getTime();
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours >= 0 && hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return published.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year:
      published.getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric',
  });
}

function HeroAction({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.heroAction, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color={active ? '#FFD180' : '#FFFFFF'} />
    </Pressable>
  );
}

function RelatedStory({
  article,
  onPress,
}: {
  article: NewsArticle;
  onPress: () => void;
}) {
  const colors = useColors();
  const category = categoryDetails(article.categoryId);
  const tint = clay[article.imageTint];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read related story: ${article.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.relatedCard,
        { backgroundColor: colors.white, borderColor: colors.progressTrack },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.relatedThumb, { backgroundColor: tint.icon }]}>
        <View style={styles.relatedHalo} />
        <Icon name={category.icon} size={25} color="#FFFFFF" />
      </View>
      <View style={styles.relatedCopy}>
        <AppText
          weight="800"
          size={12.5}
          color={colors.navy}
          numberOfLines={2}
          style={styles.relatedTitle}
        >
          {article.title}
        </AppText>
        <View style={styles.relatedMeta}>
          <AppText size={9.5} color={tint.icon}>
            {category.label}
          </AppText>
          <View style={[styles.metaDot, { backgroundColor: colors.text3 }]} />
          <AppText size={9.5} color={colors.text3}>
            {publishedLabel(article.publishedAt)}
          </AppText>
          <Icon
            name="chev"
            size={13}
            color={colors.primary}
            style={styles.relatedArrow}
          />
        </View>
      </View>
    </Pressable>
  );
}

export function NewsArticleScreen() {
  const navigation = useNavigation<HomeNav>();
  const colors = useColors();
  const articleId = (useRoute().params as { articleId: string }).articleId;
  const bookmark = useBookmark({ kind: 'news', id: articleId });
  const article = useNewsArticle(articleId);
  const feed = useNewsFeed();
  const data = article.data;
  const [saved, setSaved] = useState(false);
  const [textSizeIndex, setTextSizeIndex] = useState(1);
  const [readingProgress, setReadingProgress] = useState(0);
  const pullRefresh = usePullRefreshFeedback({
    refreshing: article.isRefetching || feed.isRefetching,
    onRefresh: () => {
      Promise.all([article.refetch(), feed.refetch()]).catch(() => undefined);
    },
  });

  useEffect(() => {
    setSaved(false);
    setTextSizeIndex(1);
    setReadingProgress(0);
  }, [articleId]);

  const related = useMemo(() => {
    if (!data) return [];
    const candidates = (feed.data?.items ?? []).filter(
      item => item.id !== data.id,
    );
    return [
      ...candidates.filter(item => item.categoryId === data.categoryId),
      ...candidates.filter(item => item.categoryId !== data.categoryId),
    ].slice(0, 2);
  }, [data, feed.data]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    setReadingProgress(
      scrollable <= 0
        ? 1
        : Math.min(1, Math.max(0, contentOffset.y / scrollable)),
    );
  };

  const saveArticle = () => {
    if (saved) return;
    bookmark();
    if (isAuthenticated()) setSaved(true);
  };

  const openAccess = () => {
    if (!data) return;
    if (!isAuthenticated()) {
      useSessionStore
        .getState()
        .setPendingDestination({ kind: 'news', id: articleId });
      useSessionStore.getState().showLogin();
    } else if (data.access.productId) {
      Alert.alert('Not available', 'Checkout is not available in the app yet.');
    }
  };

  if (article.isLoading) {
    return (
      <Screen padded={false}>
        <LoadingBlock />
      </Screen>
    );
  }

  if (article.isError || !data) {
    return (
      <Screen padded={false}>
        <View style={styles.errorHeader}>
          <HeroAction
            icon="back"
            label="Back"
            onPress={() => navigation.goBack()}
          />
        </View>
        <ErrorState
          message="This article could not be loaded."
          onRetry={() => article.refetch().catch(() => undefined)}
        />
      </Screen>
    );
  }

  const category = categoryDetails(data.categoryId);
  const tint = clay[data.imageTint];
  const bodySize = TEXT_SIZES[textSizeIndex];
  const hasAccess = data.access.state === 'granted';

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.progressTrack },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${readingProgress * 100}%`,
              backgroundColor: colors.orange,
            },
          ]}
        />
      </View>
      <ScrollView
        onScroll={event => {
          pullRefresh.scrollProps.onScroll(event);
          onScroll(event);
        }}
        scrollEventThrottle={80}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.articlePage}
      >
        <Gradient
          colors={gradients.loginHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {data.imageUrl ? (
            <Image
              source={{ uri: data.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              accessible
              accessibilityLabel={`Artwork for ${data.title}`}
            />
          ) : null}
          {data.imageUrl ? <View style={styles.heroImageScrim} /> : null}
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.heroTopRow}>
            <HeroAction
              icon="back"
              label="Back"
              onPress={() => navigation.goBack()}
            />
            <HeroAction
              icon="bookmark"
              label={saved ? 'Article saved' : 'Save article'}
              active={saved}
              onPress={saveArticle}
            />
          </View>
          {!data.imageUrl ? (
            <View style={styles.heroIcon}>
              <Icon
                name={category.icon}
                size={61}
                color="rgba(255,255,255,0.94)"
              />
            </View>
          ) : null}
          <View style={styles.heroCaption}>
            <Icon name="clock" size={11} color="rgba(255,255,255,0.78)" />
            <AppText weight="700" size={9.5} color="rgba(255,255,255,0.82)">
              {data.readingMinutes ?? 3} MIN READ
            </AppText>
          </View>
        </Gradient>

        <View style={styles.content}>
          <View style={styles.chips}>
            <View
              style={[
                styles.categoryChip,
                { backgroundColor: colors.pastel.blue },
              ]}
            >
              <AppText weight="800" size={9} color={colors.deepBlue}>
                {category.label.toUpperCase()}
              </AppText>
            </View>
            {(data.tags ?? []).slice(0, 1).map(tag => (
              <View
                key={tag}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.pastel.green },
                ]}
              >
                <AppText weight="800" size={9} color={colors.success}>
                  {tag.toUpperCase()}
                </AppText>
              </View>
            ))}
          </View>

          <AppText
            weight="900"
            size={22}
            color={colors.navy}
            style={styles.title}
          >
            {data.title}
          </AppText>

          <View style={styles.authorRow}>
            <Gradient colors={gradients.orangeCta} style={styles.avatar}>
              <AppText weight="900" size={12} color="#FFFFFF">
                {(data.byline ?? 'RACI News').trim().charAt(0).toUpperCase()}
              </AppText>
            </Gradient>
            <View style={styles.authorCopy}>
              <AppText weight="800" size={10.5} color={colors.navy}>
                {data.byline ?? 'RACI News Desk'}
              </AppText>
              <AppText
                size={9.5}
                color={colors.text3}
                style={styles.authorTime}
              >
                {publishedLabel(data.publishedAt)} · {data.readingMinutes ?? 3}{' '}
                min read
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share article"
              hitSlop={8}
              onPress={() =>
                shareService
                  .share(`${data.title}\n${data.excerpt ?? ''}`.trim())
                  .catch(() => undefined)
              }
              style={({ pressed }) => [
                styles.smallAction,
                { backgroundColor: colors.subtle },
                pressed && styles.pressed,
              ]}
            >
              <Icon name="share" size={15} color={colors.navy} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Article text size: ${
                textSizeIndex === 0
                  ? 'small'
                  : textSizeIndex === 1
                  ? 'medium'
                  : 'large'
              }. Double tap to change.`}
              hitSlop={8}
              onPress={() =>
                setTextSizeIndex(current => (current + 1) % TEXT_SIZES.length)
              }
              style={({ pressed }) => [
                styles.smallAction,
                { backgroundColor: colors.subtle },
                pressed && styles.pressed,
              ]}
            >
              <AppText weight="900" size={12} color={colors.navy}>
                Aa
              </AppText>
            </Pressable>
          </View>

          {data.excerpt ? (
            <View
              style={[
                styles.lead,
                { borderLeftColor: tint.icon, backgroundColor: tint.bg },
              ]}
            >
              <AppText
                weight="600"
                size={12.5}
                color={colors.text2}
                style={styles.leadText}
              >
                {data.excerpt}
              </AppText>
            </View>
          ) : null}

          {hasAccess ? (
            <View style={styles.body}>
              {data.body?.map((paragraph, index) => (
                <AppText
                  key={`${index}-${paragraph}`}
                  size={bodySize}
                  color={colors.ink}
                  style={[styles.paragraph, { lineHeight: bodySize * 1.72 }]}
                >
                  {paragraph}
                </AppText>
              ))}
            </View>
          ) : (
            <ClayCard variant="orange" style={styles.accessCard}>
              <View style={styles.accessHeading}>
                <View
                  style={[styles.lockIcon, { backgroundColor: colors.orange }]}
                >
                  <Icon name="lock" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.flex}>
                  <AppText weight="900" size={15} color={colors.navy}>
                    Unlock the full story
                  </AppText>
                  <AppText
                    size={11}
                    color={colors.text2}
                    style={styles.accessCopy}
                  >
                    Get the complete article, key highlights and exam-ready
                    notes.
                  </AppText>
                </View>
              </View>
              <ClayButton
                label={
                  isAuthenticated()
                    ? 'See access options'
                    : 'Sign in to continue'
                }
                icon={isAuthenticated() ? 'crown' : 'user'}
                compact
                disabled={isAuthenticated() && !data.access.productId}
                onPress={openAccess}
              />
            </ClayCard>
          )}

          {hasAccess && data.highlights?.length ? (
            <ClayCard variant="cream" style={styles.highlights}>
              <View style={styles.sectionTitleRow}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: colors.orange },
                  ]}
                >
                  <Icon name="zap" size={14} color="#FFFFFF" />
                </View>
                <AppText weight="900" size={15} color={colors.navy}>
                  Key Highlights
                </AppText>
              </View>
              {data.highlights.map(item => (
                <View key={item} style={styles.highlightRow}>
                  <Icon
                    name="check"
                    size={15}
                    color={colors.orange}
                    style={styles.highlightCheck}
                  />
                  <AppText size={11.5} color={colors.ink} style={styles.flex}>
                    {item}
                  </AppText>
                </View>
              ))}
            </ClayCard>
          ) : null}

          {hasAccess && data.tags?.length ? (
            <View style={styles.tags}>
              {data.tags.map(tag => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.pastel.blue }]}
                >
                  <AppText weight="700" size={10} color={colors.activeBlue}>
                    #{tag.replace(/^#/, '')}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {related.length ? (
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeading}>
                <View>
                  <AppText weight="900" size={17} color={colors.navy}>
                    Related Stories
                  </AppText>
                  <AppText
                    size={10}
                    color={colors.text3}
                    style={styles.relatedSubtitle}
                  >
                    Keep exploring today’s briefing
                  </AppText>
                </View>
                <Icon name="news" size={18} color={colors.primary} />
              </View>
              {related.map(item => (
                <RelatedStory
                  key={item.id}
                  article={item}
                  onPress={() =>
                    navigation.push('NewsArticle', { articleId: item.id })
                  }
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
