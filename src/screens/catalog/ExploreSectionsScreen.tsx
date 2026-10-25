import React from 'react';
import {ScrollView, useWindowDimensions, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ICON_NAMES, Icon, type IconName} from '../../assets/icons';
import {BrandedHeader, Screen} from '../../components/layout/Screen';
import {AppText, ClayButton, ErrorState, LoadingBlock, SearchInput} from '../../components/ui';
import {ClayCard, ClayIconTile} from '../../components/ui/Clay';
import {Gradient} from '../../components/ui/Gradient';
import type {CatalogItem} from '../../core/types';
import {openPublishedTarget, showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useHomeDashboard} from '../../features/home/hooks/useHomeDashboard';
import type {HomeNav} from '../../navigation/types';
import {colors, createThemedStyles, gradients, space} from '../../theme';

function iconFor(item: CatalogItem): IconName {
  return ICON_NAMES.includes(item.icon as IconName)
    ? (item.icon as IconName)
    : 'bookopen';
}

function SectionCard({
  item,
  fullWidth,
  onPress,
}: {
  item: CatalogItem;
  fullWidth: boolean;
  onPress: () => void;
}) {
  const color = item.iconColor || colors.primary;
  return (
    <ClayCard
      variant={item.clay}
      padded={false}
      onPress={onPress}
      style={[styles.sectionCard, fullWidth && styles.sectionCardFull]}>
      <ClayIconTile icon={iconFor(item)} color={color} size={46} />
      <View style={styles.cardCopy}>
        <AppText weight="900" size={14} color={colors.navy}>
          {item.title}
        </AppText>
        {item.subtitle ? (
          <AppText size={10.5} color={colors.text2} numberOfLines={3}>
            {item.subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.arrowButton}>
        <Icon name="chev" size={13} color={color} />
      </View>
    </ClayCard>
  );
}

export function ExploreSectionsScreen() {
  const navigation = useNavigation<HomeNav>();
  const {width, fontScale} = useWindowDimensions();
  const {homeQuery} = useHomeDashboard();
  const [query, setQuery] = React.useState('');
  const fullWidthCards = width < 590 || fontScale > 1.15;
  const sections = React.useMemo(
    () => homeQuery.data?.sections ?? [],
    [homeQuery.data?.sections],
  );
  const results = React.useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return sections;
    return sections.filter(item =>
      `${item.title} ${item.subtitle ?? ''}`.toLocaleLowerCase().includes(term),
    );
  }, [query, sections]);

  return (
    <Screen padded={false}>
      <BrandedHeader
        showBack
        onBack={() => navigation.goBack()}
        onNotifications={showLearnerUnavailable}
      />
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Gradient
          colors={gradients.banner}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="bookopen" size={28} color="#fff" />
          </View>
          <AppText weight="900" size={23} color="#fff">
            Explore RACI
          </AppText>
          <AppText size={11.5} color="rgba(255,255,255,0.82)" style={styles.heroSubtitle}>
            Browse the learning paths currently published by RACI.
          </AppText>
          <View style={styles.heroPill}>
            <Icon name="bookopen" size={11} color="#fff" />
            <AppText weight="800" size={9.5} color="#fff">
              {sections.length} learning {sections.length === 1 ? 'path' : 'paths'}
            </AppText>
          </View>
        </Gradient>

        <SearchInput
          value={query}
          placeholder="Search learning paths"
          onChangeText={setQuery}
          onClear={() => setQuery('')}
        />

        {homeQuery.isLoading ? <LoadingBlock /> : null}
        {homeQuery.isError ? (
          <ErrorState message="Learning paths could not load." onRetry={() => homeQuery.refetch()} />
        ) : null}
        {!homeQuery.isLoading && !homeQuery.isError && results.length ? (
          <View style={styles.grid}>
            {results.map(item => (
              <SectionCard
                key={item.id}
                item={item}
                fullWidth={fullWidthCards}
                onPress={() =>
                  openPublishedTarget(
                    navigation,
                    item.targetKind ?? item.kind,
                    item.targetId ?? item.id,
                  )
                }
              />
            ))}
          </View>
        ) : null}
        {!homeQuery.isLoading && !homeQuery.isError && !results.length ? (
          <ClayCard variant="white" style={styles.emptyCard}>
            <Icon name="search" size={24} color={colors.primary} />
            <AppText center weight="900" size={14} color={colors.navy}>
              No published sections found
            </AppText>
            <AppText center size={10.5} color={colors.text2}>
              Try another search term or refresh when new learning paths are published.
            </AppText>
            {query ? <ClayButton label="Clear search" compact onPress={() => setQuery('')} /> : null}
          </ClayCard>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {padding: space.pageX, paddingBottom: 30, gap: 14},
  hero: {
    minHeight: 170,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    gap: 7,
  },
  heroIcon: {
    position: 'absolute',
    right: 25,
    top: 31,
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroSubtitle: {maxWidth: 410, lineHeight: 17},
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 11},
  sectionCard: {
    width: '48%',
    flexGrow: 1,
    maxWidth: '49%',
    minHeight: 160,
    padding: 13,
    gap: 10,
  },
  sectionCardFull: {width: '100%', maxWidth: '100%', minHeight: 142},
  cardCopy: {flex: 1, gap: 5},
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.66)',
  },
  emptyCard: {alignItems: 'center', paddingVertical: 24, gap: 8},
});
