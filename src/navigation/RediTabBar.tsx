import React from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {BottomTabBarHeightCallbackContext} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';
import {Icon} from '../assets/icons';
import type {IconName} from '../assets/icons';
import {AppText} from '../components/ui/AppText';
import {colors, createThemedStyles} from '../theme';
import {useTheme} from '../theme/ThemeProvider';
import {translateUiString} from '../features/settings/uiTranslations';
import type {TabParamList} from './types';

type TabMeta = {
  name: keyof TabParamList;
  label: string;
  icon: IconName;
};

type Props = BottomTabBarProps & {
  tabs: TabMeta[];
};

const PILL_INSET = 5;
const DOCK_H_PAD = 6;

/** Fast, no-bounce motion — Material-style ease-out. */
const EASE_OUT = Easing.bezier(0.2, 0, 0, 1);
const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);

function smoothTo(
  value: Animated.Value,
  toValue: number,
  duration: number,
  easing: (t: number) => number = EASE_OUT,
) {
  Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  }).start();
}

function TabItem({
  label,
  icon,
  focused,
  isLive,
  onPress,
  onLongPress,
  accessibilityLabel,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  isLive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const press = React.useRef(new Animated.Value(1)).current;
  const focus = React.useRef(new Animated.Value(focused ? 1 : 0)).current;
  const livePulse = React.useRef(new Animated.Value(0.55)).current;

  React.useEffect(() => {
    smoothTo(focus, focused ? 1 : 0, 140, EASE_OUT);
  }, [focused, focus]);

  React.useEffect(() => {
    if (!isLive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 700,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0.4,
          duration: 700,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, livePulse]);

  const iconScale = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const labelOpacity = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  const activeColor = theme.colors.primary;
  const idleColor = theme.colors.inactiveNav;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => smoothTo(press, 0.94, 80, EASE_OUT)}
      onPressOut={() => smoothTo(press, 1, 120, EASE_OUT)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tab"
      accessibilityState={{selected: focused}}
      style={styles.tab}
      hitSlop={4}>
      <Animated.View style={[styles.tabInner, {transform: [{scale: press}]}]}>
        <View style={styles.iconWrap}>
          <Animated.View style={{transform: [{scale: iconScale}]}}>
            <Icon name={icon} size={20} color={focused ? activeColor : idleColor} />
          </Animated.View>
          {isLive ? (
            <Animated.View
              style={[
                styles.liveDot,
                {
                  opacity: livePulse,
                  backgroundColor: focused ? colors.error : '#FF5A5F',
                  transform: [{scale: livePulse}],
                },
              ]}
            />
          ) : null}
        </View>
        <Animated.View style={{opacity: labelOpacity}}>
          <AppText
            center
            weight={focused ? '700' : '600'}
            size={10}
            numberOfLines={1}
            color={focused ? activeColor : idleColor}>
            {label}
          </AppText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function RediTabBar({state, navigation, insets, tabs}: Props) {
  const theme = useTheme();
  const {i18n} = useTranslation();
  const reportHeight = React.useContext(BottomTabBarHeightCallbackContext);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const pillX = React.useRef(new Animated.Value(0)).current;
  const dockEnter = React.useRef(new Animated.Value(0)).current;
  const lastIndex = React.useRef(state.index);
  const measured = React.useRef(false);

  const tabCount = Math.max(state.routes.length, 1);
  const slotWidth = trackWidth > 0 ? trackWidth / tabCount : 0;
  const pillWidth = Math.max(slotWidth - PILL_INSET * 2, 0);
  const targetX = state.index * slotWidth + PILL_INSET;

  React.useEffect(() => {
    smoothTo(dockEnter, 1, 220, EASE_OUT);
  }, [dockEnter]);

  React.useEffect(() => {
    if (slotWidth <= 0) return;

    // First measure: snap into place with no motion.
    if (!measured.current) {
      measured.current = true;
      pillX.setValue(targetX);
      lastIndex.current = state.index;
      return;
    }

    if (lastIndex.current === state.index) {
      pillX.setValue(targetX);
      return;
    }

    lastIndex.current = state.index;
    smoothTo(pillX, targetX, 180, EASE_OUT);
  }, [state.index, slotWidth, targetX, pillX]);

  const onShellLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      reportHeight?.(event.nativeEvent.layout.height);
    },
    [reportHeight],
  );

  const isDark = theme.scheme === 'dark';
  const dockBg = isDark ? 'rgba(19,27,45,0.94)' : 'rgba(255,255,255,0.7)';
  const dockBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,35,126,0.08)';
  const pillBg = isDark ? 'rgba(112,187,255,0.16)' : colors.pastel.blue;
  const shellPadBottom = Math.max(insets.bottom, 10);

  return (
    <Animated.View
      onLayout={onShellLayout}
      style={[
        styles.shell,
        {
          backgroundColor: isDark ? theme.colors.scroll : 'transparent',
          paddingBottom: shellPadBottom,
          opacity: dockEnter,
          transform: [
            {
              translateY: dockEnter.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}>
      <View
        style={[
          styles.dock,
          {
            backgroundColor: dockBg,
            borderColor: dockBorder,
            boxShadow: isDark
              ? '0 10px 28px rgba(0,0,0,0.45)'
              : '0 12px 28px rgba(26,35,126,0.12)',
          },
        ]}>
        <View
          style={styles.track}
          onLayout={event => {
            const next = event.nativeEvent.layout.width;
            if (next !== trackWidth) setTrackWidth(next);
          }}>
          {slotWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pill,
                {
                  width: pillWidth,
                  backgroundColor: pillBg,
                  transform: [{translateX: pillX}],
                },
              ]}
            />
          ) : null}

          {state.routes.map((route, index) => {
            const meta = tabs[index];
            const focused = state.index === index;
            return (
              <TabItem
                key={route.key}
                label={meta.label}
                icon={meta.icon}
                focused={focused}
                isLive={meta.name === 'LiveTab'}
                accessibilityLabel={translateUiString(
                  meta.label,
                  i18n.resolvedLanguage ?? i18n.language,
                )}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() =>
                  navigation.emit({type: 'tabLongPress', target: route.key})
                }
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = createThemedStyles({
  shell: {
    paddingHorizontal: 14,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  dock: {
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: DOCK_H_PAD,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 20,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
    width: '100%',
  },
  iconWrap: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
