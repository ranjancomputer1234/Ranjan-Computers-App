import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewProps,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, colors, space } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../ui/AppText';
import { IconButton } from '../ui/Clay';
import { RediLogo } from '../../assets/illustrations';
import { Gradient } from '../ui/Gradient';
import { gradients } from '../../theme';
import { Icon } from '../../assets/icons';
import { StudyPaperBackdrop } from './StudyPaperBackdrop';

type HeaderScale = {
  logoSize: number;
  nameSize: number;
  instituteSize: number;
  titleSize: number;
  subtitleSize: number;
  avatarSize: number;
  padX: number;
  padY: number;
  gap: number;
  actionGap: number;
  showInstitute: boolean;
};

function useHeaderScale(actionCount = 0, leadingCount = 0): HeaderScale {
  const {width} = useWindowDimensions();
  const compact = width < 360;
  const narrow = width < 400;

  const controlSize = compact ? 38 : 42;
  const reserved =
    Math.min(actionCount, 4) * controlSize +
    leadingCount * controlSize +
    (compact ? 64 : 72);
  const available = width - reserved;

  return {
    logoSize: compact ? 44 : narrow ? 48 : 52,
    nameSize: compact ? 20 : narrow ? 22 : 24,
    instituteSize: compact ? 11 : 12.5,
    titleSize: compact ? 18 : narrow ? 19 : 21,
    subtitleSize: compact ? 11.5 : 12.5,
    avatarSize: compact ? 38 : 42,
    padX: compact ? 14 : narrow ? 16 : 18,
    padY: compact ? 14 : 16,
    gap: compact ? 10 : 12,
    actionGap: compact ? 6 : 8,
    showInstitute: available >= 110,
  };
}

function BrandMark({
  size,
  plateColor,
  ringColor,
}: {
  size: number;
  plateColor: string;
  ringColor: string;
}) {
  const plate = size + 10;
  return (
    <View
      style={[
        styles.logoPlate,
        {
          width: plate,
          height: plate,
          borderRadius: plate * 0.28,
          backgroundColor: plateColor,
          borderColor: ringColor,
        },
      ]}
    >
      <RediLogo size={size} />
    </View>
  );
}

function HeaderRule({scheme}: {scheme: 'light' | 'dark'}) {
  const base =
    scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(26,35,126,0.08)';
  const accent =
    scheme === 'dark'
      ? (['transparent', 'rgba(112,187,255,0.85)', 'transparent'] as const)
      : (['transparent', 'rgba(25,118,210,0.75)', 'transparent'] as const);

  return (
    <View style={styles.headerRule} pointerEvents="none">
      <View style={[styles.headerRuleBase, {backgroundColor: base}]} />
      <Gradient
        colors={accent}
        start={{x: 0, y: 0.5}}
        end={{x: 1, y: 0.5}}
        style={styles.headerRuleAccent}
      />
    </View>
  );
}

function HeaderActions({
  children,
  gap,
  scheme,
}: {
  children: React.ReactNode;
  gap: number;
  scheme: 'light' | 'dark';
}) {
  return (
    <View
      style={[
        styles.actionTray,
        {
          gap,
          backgroundColor:
            scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
          borderColor:
            scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(26,35,126,0.08)',
        },
      ]}
    >
      {children}
    </View>
  );
}

export function BrandedHeader({
  onSearch,
  onNotifications,
  onProfile,
  unread,
  showBack,
  onBack,
}: {
  onSearch?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
  unread?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const theme = useTheme();
  const actionCount =
    Number(Boolean(onSearch)) +
    Number(Boolean(onNotifications)) +
    Number(Boolean(onProfile));
  const scale = useHeaderScale(actionCount, Number(Boolean(showBack)));
  const plateColor =
    theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#FFFFFF';
  const ringColor =
    theme.scheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(26,35,126,0.1)';
  const hasActions = actionCount > 0;

  return (
    <View
      style={[styles.headerShell, headerWash(theme.scheme, theme.colors.scroll)]}
      accessibilityRole="header"
    >
      <View
        style={[
          styles.appbar,
          {
            paddingHorizontal: scale.padX,
            paddingTop: scale.padY,
            paddingBottom: scale.padY - 2,
            gap: scale.gap,
            minHeight: scale.logoSize + scale.padY * 2 + 10,
          },
        ]}
      >
        {showBack ? (
          <IconButton icon="back" onPress={onBack} accessibilityLabel="Back" />
        ) : null}

        <View style={[styles.brandCluster, {gap: scale.gap}]}>
          <BrandMark
            size={scale.logoSize}
            plateColor={plateColor}
            ringColor={ringColor}
          />
          <View style={styles.id}>
            <AppText
              weight="900"
              size={scale.nameSize}
              color={theme.colors.navy}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={styles.wordmark}
            >
              {brand.name}
            </AppText>
            <View
              style={[
                styles.brandAccent,
                {backgroundColor: theme.colors.primary},
              ]}
            />
            {scale.showInstitute ? (
              <AppText
                weight="600"
                size={scale.instituteSize}
                color={theme.colors.text2}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.brandSub}
              >
                {brand.institute}
              </AppText>
            ) : null}
          </View>
        </View>

        {hasActions ? (
          <HeaderActions gap={scale.actionGap} scheme={theme.scheme}>
            {onSearch ? (
              <IconButton
                icon="search"
                onPress={onSearch}
                accessibilityLabel="Search"
              />
            ) : null}
            {onNotifications ? (
              <IconButton
                icon="bell"
                onPress={onNotifications}
                dot={unread}
                accessibilityLabel="Notifications"
              />
            ) : null}
            {onProfile ? (
              <Pressable
                onPress={onProfile}
                accessibilityRole="button"
                hitSlop={7}
                accessibilityLabel="Profile"
                style={({pressed}) => [{opacity: pressed ? 0.85 : 1}]}
              >
                <Gradient
                  colors={gradients.avatar}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={[
                    styles.avatar,
                    {
                      width: scale.avatarSize,
                      height: scale.avatarSize,
                      borderRadius: scale.avatarSize / 2,
                    },
                  ]}
                >
                  <Icon
                    name="user"
                    size={Math.round(scale.avatarSize * 0.48)}
                    color="#fff"
                  />
                </Gradient>
              </Pressable>
            ) : null}
          </HeaderActions>
        ) : null}
      </View>
      <HeaderRule scheme={theme.scheme} />
    </View>
  );
}

export function DetailHeader({
  title,
  subtitle,
  onBack,
  onShare,
  onBookmark,
  onFilter,
  onCalendar,
  onMore,
  onNotifications,
  unread,
  right,
  bookmarkActive,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onFilter?: () => void;
  onCalendar?: () => void;
  onMore?: () => void;
  onNotifications?: () => void;
  unread?: boolean;
  right?: React.ReactNode;
  bookmarkActive?: boolean;
}) {
  const theme = useTheme();
  const actionCount =
    Number(Boolean(right)) +
    Number(Boolean(onCalendar)) +
    Number(Boolean(onFilter)) +
    Number(Boolean(onShare)) +
    Number(Boolean(onBookmark)) +
    Number(Boolean(onNotifications)) +
    Number(Boolean(onMore));
  const scale = useHeaderScale(actionCount, Number(Boolean(onBack)));
  const hasActions = actionCount > 0;

  return (
    <View
      style={[styles.headerShell, headerWash(theme.scheme, theme.colors.scroll)]}
      accessibilityRole="header"
    >
      <View
        style={[
          styles.appbar,
          {
            paddingHorizontal: scale.padX,
            paddingTop: scale.padY,
            paddingBottom: scale.padY - 2,
            gap: scale.gap,
            minHeight: 56 + scale.padY,
          },
        ]}
      >
        {onBack ? (
          <IconButton icon="back" onPress={onBack} accessibilityLabel="Back" />
        ) : null}
        <View style={styles.id}>
          {title ? (
            <AppText
              weight="900"
              size={scale.titleSize}
              color={theme.colors.navy}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              ellipsizeMode="tail"
              style={styles.wordmark}
            >
              {title}
            </AppText>
          ) : null}
          {subtitle ? (
            <AppText
              weight="500"
              size={scale.subtitleSize}
              color={theme.colors.text2}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.brandSub}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {hasActions ? (
          <HeaderActions gap={scale.actionGap} scheme={theme.scheme}>
            {right}
            {onCalendar ? (
              <IconButton
                icon="cal"
                onPress={onCalendar}
                accessibilityLabel="Calendar"
              />
            ) : null}
            {onFilter ? (
              <IconButton
                icon="slider"
                onPress={onFilter}
                accessibilityLabel="Filters"
              />
            ) : null}
            {onShare ? (
              <IconButton
                icon="share"
                onPress={onShare}
                accessibilityLabel="Share"
              />
            ) : null}
            {onBookmark ? (
              <IconButton
                icon="bookmark"
                color={bookmarkActive ? theme.colors.primary : theme.colors.navy}
                onPress={onBookmark}
                accessibilityLabel={
                  bookmarkActive ? 'Remove bookmark' : 'Bookmark'
                }
              />
            ) : null}
            {onNotifications ? (
              <IconButton
                icon="bell"
                onPress={onNotifications}
                dot={unread}
                accessibilityLabel="Notifications"
              />
            ) : null}
            {onMore ? (
              <IconButton
                icon="kebab"
                onPress={onMore}
                accessibilityLabel="More options"
              />
            ) : null}
          </HeaderActions>
        ) : null}
      </View>
      <HeaderRule scheme={theme.scheme} />
    </View>
  );
}

export function Screen({
  children,
  padded = true,
  pullGestureHandlers,
}: {
  children: React.ReactNode;
  padded?: boolean;
  pullGestureHandlers?: Pick<
    ViewProps,
    | 'onStartShouldSetResponder'
    | 'onMoveShouldSetResponder'
    | 'onStartShouldSetResponderCapture'
    | 'onMoveShouldSetResponderCapture'
    | 'onResponderGrant'
    | 'onResponderMove'
    | 'onResponderRelease'
    | 'onResponderTerminate'
    | 'onResponderTerminationRequest'
    | 'onTouchStartCapture'
    | 'onTouchMoveCapture'
    | 'onTouchEndCapture'
    | 'onTouchCancelCapture'
  >;
}) {
  const insets = useSafeAreaInsets();
  const tabHeight = React.useContext(BottomTabBarHeightContext);
  const theme = useTheme();
  return (
    <KeyboardAvoidingView
      {...pullGestureHandlers}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.screen,
        {
          backgroundColor: theme.scheme === 'dark' ? theme.colors.scroll : '#FFFFFF',
          paddingBottom: tabHeight ? 0 : insets.bottom,
        },
      ]}
    >
      <StatusBar
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      {theme.scheme === 'light' ? <StudyPaperBackdrop /> : null}
      <View
        style={[
          styles.safeFrame,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View style={[styles.body, padded && styles.padded]}>{children}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

export function StickyActionFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={[styles.footer, { paddingBottom: 12 }]}>{children}</View>;
}

const styles = createThemedStyles({
  screen: { flex: 1, backgroundColor: colors.scroll },
  safeFrame: { flex: 1 },
  body: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  padded: {
    paddingHorizontal: space.pageX,
    paddingBottom: space.pageBottom,
    gap: space.section,
  },
  headerShell: {
    width: '100%',
    backgroundColor: colors.scroll,
  },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  headerRule: {
    width: '100%',
    height: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  headerRuleBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  headerRuleAccent: {
    alignSelf: 'center',
    width: '42%',
    height: 2.5,
    borderRadius: 2,
    marginBottom: 0,
  },
  brandCluster: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#1A237E',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 3},
      },
      android: {elevation: 2},
      default: {},
    }),
  },
  id: {flex: 1, minWidth: 0, justifyContent: 'center'},
  wordmark: {
    letterSpacing: 0.6,
    includeFontPadding: false,
  },
  brandAccent: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  brandSub: {
    marginTop: 4,
    includeFontPadding: false,
    letterSpacing: 0.15,
  },
  actionTray: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(26,35,126,0.08)',
  },
});

function headerWash(scheme: 'light' | 'dark', darkColor: string) {
  return {
    backgroundColor: scheme === 'dark' ? darkColor : 'rgba(255,255,255,0.7)',
  };
}
