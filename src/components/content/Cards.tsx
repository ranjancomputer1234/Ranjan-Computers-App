import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Image,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import type {CatalogItem} from '../../core/types';
import {colors} from '../../theme';
import {ICON_NAMES, Icon} from '../../assets/icons';
import type {IconName} from '../../assets/icons';
import {AppText} from '../ui/AppText';
import {AccessBadge} from '../ui/Feedback';
import {ClayCard, ClayIconTile} from '../ui/Clay';

export function CategoryCard({
  item,
  onPress,
}: {
  item: CatalogItem;
  onPress?: () => void;
}) {
  return (
    <ClayCard variant={item.clay} onPress={onPress} padded={false} style={styles.card}>
      <ClayIconTile icon={item.icon as IconName} color={item.iconColor} letter={item.letter} />
      <View style={styles.body}>
        <AppText weight="800" size={12} color={colors.navy}>
          {item.title}
        </AppText>
        {item.subtitle ? (
          <AppText size={9.5} color={colors.text2}>
            {item.subtitle}
          </AppText>
        ) : null}
        <AccessBadge pricing={item.pricing} />
      </View>
      <Icon name="chev" size={14} color="#B0BEC5" />
    </ClayCard>
  );
}

/**
 * A flatter course-only card. Pricing is communicated by one consistent
 * accent: green for free courses and orange for paid courses.
 */
export function CourseCatalogCard({
  item,
  onPress,
}: {
  item: CatalogItem;
  onPress?: () => void;
}) {
  const isFree = item.pricing === 'free';
  const accent = isFree ? colors.success : colors.orange;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${isFree ? 'free' : 'paid'} course`}
      onPress={onPress}
      style={({pressed}) => [
        styles.courseCard,
        isFree ? styles.courseCardFree : styles.courseCardPaid,
        pressed && styles.courseCardPressed,
      ]}>
      <View
        style={[
          styles.courseIcon,
          isFree ? styles.courseIconFree : styles.courseIconPaid,
        ]}>
        <CourseIconGraphic item={item} accent={accent} />
      </View>

      <View style={styles.courseBody}>
        <AppText
          weight="800"
          size={12}
          color={colors.navy}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          translate={false}>
          {item.title}
        </AppText>
        <View
          style={[
            styles.courseBadge,
            isFree ? styles.courseBadgeFree : styles.courseBadgePaid,
          ]}>
          <AppText weight="800" size={9} color={accent} style={styles.courseBadgeText}>
            {isFree ? 'FREE' : 'PAID'}
          </AppText>
        </View>
      </View>

      <Icon name="chev" size={14} color={accent} strokeWidth={2.5} />
    </Pressable>
  );
}

function CourseIconGraphic({item, accent}: {item: CatalogItem; accent: string}) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [item.iconUrl]);

  if (item.iconUrl && !imageFailed) {
    return (
      <Image
        source={{uri: item.iconUrl}}
        resizeMode="contain"
        style={styles.courseIconImage}
        onError={() => setImageFailed(true)}
        accessibilityIgnoresInvertColors
      />
    );
  }

  if (item.letter) {
    return (
      <AppText
        weight="900"
        size={item.letter.length > 1 ? 13 : 18}
        color={accent}
        translate={false}>
        {item.letter}
      </AppText>
    );
  }

  const icon = ICON_NAMES.includes(item.icon as IconName)
    ? (item.icon as IconName)
    : 'bookopen';
  return <Icon name={icon} size={23} color={accent} />;
}

export function ExploreTile({
  title,
  icon,
  clay,
  color,
  onPress,
}: {
  title: string;
  icon: IconName;
  clay: CatalogItem['clay'];
  color: string;
  onPress?: () => void;
}) {
  const {width, fontScale} = useWindowDimensions();
  return (
    <ClayCard variant={clay} onPress={onPress} padded={false} style={[styles.explore, {width: width < 360 || fontScale > 1.25 ? '100%' : '48%'}]}>
      <ClayIconTile icon={icon} color={color} size={40} />
      <AppText weight="800" size={12} color={colors.navy} style={styles.flex}>
        {title}
      </AppText>
      <Icon name="chev" size={14} color="#B0BEC5" />
    </ClayCard>
  );
}

const styles = createThemedStyles({
  card: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, minHeight: 64},
  explore: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 11},
  body: {flex: 1, minWidth: 0, gap: 5},
  flex: {flex: 1, minWidth: 0},
  courseCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  courseCardFree: {
    borderColor: '#D4EAD8',
    backgroundColor: '#E8F5E9',
    boxShadow:
      '0 12px 20px -15px rgba(46, 125, 50, 0.5), inset 2px 2px 6px rgba(255, 255, 255, 0.7), inset -2px -2px 6px rgba(46, 125, 50, 0.1)',
  },
  courseCardPaid: {
    borderColor: '#F5DDC2',
    backgroundColor: '#FFF3E0',
    boxShadow:
      '0 12px 20px -15px rgba(245, 124, 0, 0.5), inset 2px 2px 6px rgba(255, 255, 255, 0.7), inset -2px -2px 6px rgba(245, 124, 0, 0.1)',
  },
  courseCardPressed: {opacity: 0.86, transform: [{scale: 0.99}]},
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    boxShadow:
      '0 7px 12px -9px rgba(26, 35, 126, 0.3), inset 2px 2px 5px rgba(255, 255, 255, 0.8), inset -2px -2px 5px rgba(100, 116, 139, 0.14)',
  },
  courseIconFree: {borderWidth: 1, borderColor: '#D4EAD8'},
  courseIconPaid: {borderWidth: 1, borderColor: '#F5DDC2'},
  courseIconImage: {width: 27, height: 27},
  courseBody: {flex: 1, minWidth: 0, gap: 6},
  courseBadge: {borderRadius: 6, paddingVertical: 4, paddingHorizontal: 7},
  courseBadgeFree: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 8px -6px rgba(46, 125, 50, 0.45)',
  },
  courseBadgePaid: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 8px -6px rgba(245, 124, 0, 0.45)',
  },
  courseBadgeText: {letterSpacing: 0.6},
});
