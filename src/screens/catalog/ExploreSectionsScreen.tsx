import React from 'react';
import {ScrollView, useWindowDimensions, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Icon} from '../../assets/icons';
import {BrandedHeader, Screen} from '../../components/layout/Screen';
import {ExploreDetailCard} from '../../components/content/ExploreOptions';
import {AppText, ClayButton, SearchInput} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {Gradient} from '../../components/ui/Gradient';
import {exploreOptions} from '../../features/catalog/exploreOptions';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {translateUiString} from '../../features/settings/uiTranslations';
import type {HomeNav} from '../../navigation/types';
import {colors, createThemedStyles, gradients, space} from '../../theme';

export function ExploreSectionsScreen() {
  const navigation = useNavigation<HomeNav>();
  const {width} = useWindowDimensions();
  const [query, setQuery] = React.useState('');
  const showCluster = width >= 430;
  const results = React.useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return exploreOptions;
    return exploreOptions.filter(option => {
      const english = [option.title, option.subtitle, option.description, ...option.highlights].join(' ');
      const hindi = [option.title, option.subtitle, option.description, ...option.highlights]
        .map(part => translateUiString(part))
        .join(' ');
      return `${english} ${hindi}`.toLocaleLowerCase().includes(term);
    });
  }, [query]);

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
          <AppText weight="800" size={11} color="rgba(255,255,255,0.72)" style={styles.eyebrow}>
            RACI
          </AppText>
          <AppText weight="900" size={28} color="#fff">
            Explore
          </AppText>
          <AppText
            size={12.5}
            color="rgba(255,255,255,0.86)"
            style={[styles.heroCopy, showCluster && styles.heroCopyBesideCluster]}>
            One place to learn skills, prepare for exams and discover something new every day.
          </AppText>
          <View style={styles.heroPill}>
            <AppText weight="800" size={10} color="#fff">
              6 learning paths
            </AppText>
          </View>
          {showCluster ? (
            <View style={styles.cluster} pointerEvents="none">
              {exploreOptions.map(option => (
                <View key={option.id} style={styles.clusterIcon}>
                  <Icon name={option.icon} size={16} color="#fff" />
                </View>
              ))}
            </View>
          ) : null}
        </Gradient>

        <SearchInput
          value={query}
          placeholder="Search skills, exams, news and more"
          onChangeText={setQuery}
          onClear={() => setQuery('')}
        />

        {results.length ? (
          <View style={styles.list}>
            {results.map(option => (
              <ExploreDetailCard
                key={option.id}
                option={option}
                onPress={() => option.open(navigation)}
              />
            ))}
          </View>
        ) : (
          <ClayCard variant="white" style={styles.emptyCard}>
            <Icon name="search" size={24} color={colors.primary} />
            <AppText center weight="900" size={14} color={colors.navy}>
              No sections found
            </AppText>
            <AppText center size={11.5} color={colors.text2} style={styles.emptyCopy}>
              Try another search term or view all learning paths.
            </AppText>
            <ClayButton label="Clear search" compact onPress={() => setQuery('')} />
          </ClayCard>
        )}

        <ClayCard variant="sky" style={styles.startCard}>
          <AppText weight="900" size={15} color={colors.navy}>
            Not sure where to start?
          </AppText>
          <AppText size={12} color={colors.text2} style={styles.startCopy}>
            Try a free course and learn at your own pace.
          </AppText>
          <ClayButton
            label="Start free"
            compact
            onPress={() => navigation.navigate('ComputerCourses', {pricing: 'free'})}
          />
        </ClayCard>
      </ScrollView>
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {padding: space.pageX, paddingBottom: 32, gap: 14},
  hero: {
    minHeight: 168,
    borderRadius: 24,
    padding: 18,
    paddingRight: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    gap: 7,
  },
  eyebrow: {letterSpacing: 1.4},
  heroCopy: {maxWidth: 520, lineHeight: 19},
  heroCopyBesideCluster: {maxWidth: 250},
  heroPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  cluster: {
    position: 'absolute',
    right: 16,
    top: 22,
    width: 108,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clusterIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  list: {gap: 12},
  emptyCard: {alignItems: 'center', paddingVertical: 24, gap: 8},
  emptyCopy: {lineHeight: 17, maxWidth: 280},
  startCard: {gap: 8, alignItems: 'flex-start'},
  startCopy: {lineHeight: 18},
});
