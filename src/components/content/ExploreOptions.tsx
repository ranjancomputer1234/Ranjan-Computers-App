import React from 'react';
import {Pressable, View} from 'react-native';
import {Icon} from '../../assets/icons';
import {exploreOptions, type ExploreOption} from '../../features/catalog/exploreOptions';
import {translateUiString} from '../../features/settings/uiTranslations';
import {clay, colors, createThemedStyles} from '../../theme';
import {AppText} from '../ui/AppText';
import {ExploreTile} from './Cards';

function toneFor(option: ExploreOption) {
  return clay[option.clay].icon;
}

export function ExploreHomeGrid({
  onOpen,
}: {
  onOpen: (option: ExploreOption) => void;
}) {
  return (
    <View style={styles.grid}>
      {exploreOptions.map(option => (
        <ExploreTile
          key={option.id}
          title={option.title}
          icon={option.icon}
          clay={option.clay}
          color={toneFor(option)}
          onPress={() => onOpen(option)}
        />
      ))}
    </View>
  );
}

export function ExploreDetailCard({
  option,
  onPress,
}: {
  option: ExploreOption;
  onPress: () => void;
}) {
  const tone = toneFor(option);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translateUiString(option.title)}
      onPress={onPress}
      style={({pressed}) => [styles.detail, pressed && styles.pressed]}>
      <View style={[styles.accent, {backgroundColor: tone}]} />
      <View style={styles.detailBody}>
        <View style={styles.detailTop}>
          <View style={[styles.detailIcon, {backgroundColor: clay[option.clay].bg}]}>
            <Icon name={option.icon} size={24} color={tone} />
          </View>
          <View style={styles.detailTitles}>
            <AppText weight="900" size={16} color={colors.navy} numberOfLines={2}>
              {option.title}
            </AppText>
            <AppText weight="700" size={11.5} color={tone} numberOfLines={2}>
              {option.subtitle}
            </AppText>
          </View>
          <View style={[styles.open, {backgroundColor: clay[option.clay].bg}]}>
            <Icon name="chev" size={14} color={tone} />
          </View>
        </View>
        <AppText size={12.5} color={colors.text2} style={styles.description}>
          {option.description}
        </AppText>
        <View style={styles.chips}>
          {option.highlights.map(label => (
            <View key={label} style={[styles.chip, {backgroundColor: clay[option.clay].bg}]}>
              <AppText weight="700" size={10.5} color={tone}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = createThemedStyles({
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 11},
  pressed: {opacity: 0.9, transform: [{scale: 0.985}]},
  detail: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 16px 26px -18px rgba(26,35,126,0.45)',
  },
  accent: {height: 4},
  detailBody: {paddingHorizontal: 14, paddingTop: 14, paddingBottom: 15, gap: 11},
  detailTop: {flexDirection: 'row', alignItems: 'center', gap: 12},
  detailIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitles: {flex: 1, minWidth: 0, gap: 3},
  open: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {lineHeight: 19},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 7},
  chip: {borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9},
});
