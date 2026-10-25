import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createThemedStyles} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {AppText} from './AppText';

const activeRefreshes = new Set<symbol>();
const pullProgresses = new Map<symbol, number>();
const refreshListeners = new Set<() => void>();
let refreshSnapshot = 0;
const MIN_REFRESH_ACTIVE_MS = 1400;

function publishRefreshState() {
  const maxPullProgress = Math.max(0, ...pullProgresses.values());
  const nextSnapshot =
    activeRefreshes.size * 101 + Math.round(maxPullProgress * 100);
  if (nextSnapshot === refreshSnapshot) return;
  refreshSnapshot = nextSnapshot;
  refreshListeners.forEach(listener => listener());
}

function setRefreshActive(id: symbol, active: boolean) {
  const changed = active ? !activeRefreshes.has(id) : activeRefreshes.has(id);
  if (!changed) return;
  if (active) activeRefreshes.add(id);
  else activeRefreshes.delete(id);
  publishRefreshState();
}

function setPullProgress(id: symbol, progress: number) {
  const next = Math.round(Math.max(0, Math.min(1, progress)) * 20) / 20;
  if (next === 0) {
    if (!pullProgresses.delete(id)) return;
  } else {
    if (pullProgresses.get(id) === next) return;
    pullProgresses.set(id, next);
  }
  publishRefreshState();
}

function subscribe(listener: () => void) {
  refreshListeners.add(listener);
  return () => refreshListeners.delete(listener);
}

function getRefreshSnapshot() {
  return refreshSnapshot;
}

/**
 * Attach these handlers to a refreshable screen and its ScrollView/FlatList.
 * Touch distance drives the custom indicator and releasing past the threshold
 * invokes the screen's refresh without mounting a platform spinner.
 */
export function usePullRefreshFeedback({
  refreshing,
  onRefresh,
  enabled = true,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  enabled?: boolean;
}) {
  const feedbackId = React.useRef(Symbol('pull-feedback')).current;
  const touchStartY = React.useRef<number | undefined>(undefined);
  const isAtTop = React.useRef(true);
  const pullProgress = React.useRef(0);
  const refreshingRef = React.useRef(refreshing);
  const onRefreshRef = React.useRef(onRefresh);
  const enabledRef = React.useRef(enabled);
  const wasRefreshing = React.useRef(refreshing);
  const refreshActivatedAt = React.useRef(0);
  const fallbackTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  refreshingRef.current = refreshing;
  onRefreshRef.current = onRefresh;
  enabledRef.current = enabled;

  const showRefresh = React.useCallback(() => {
    if (!activeRefreshes.has(feedbackId)) {
      refreshActivatedAt.current = Date.now();
    }
    if (fallbackTimeout.current) clearTimeout(fallbackTimeout.current);
    fallbackTimeout.current = undefined;
    setRefreshActive(feedbackId, true);
  }, [feedbackId]);

  const scheduleRefreshHide = React.useCallback(() => {
    if (fallbackTimeout.current) clearTimeout(fallbackTimeout.current);
    const remaining = Math.max(
      0,
      MIN_REFRESH_ACTIVE_MS - (Date.now() - refreshActivatedAt.current),
    );
    fallbackTimeout.current = setTimeout(() => {
      fallbackTimeout.current = undefined;
      if (refreshingRef.current) return;
      setRefreshActive(feedbackId, false);
      refreshActivatedAt.current = 0;
    }, remaining);
  }, [feedbackId]);

  React.useEffect(() => {
    if (refreshing) {
      showRefresh();
    } else if (wasRefreshing.current) {
      scheduleRefreshHide();
    }
    wasRefreshing.current = refreshing;
  }, [refreshing, scheduleRefreshHide, showRefresh]);

  React.useEffect(() => {
    return () => {
      if (fallbackTimeout.current) clearTimeout(fallbackTimeout.current);
      setPullProgress(feedbackId, 0);
      setRefreshActive(feedbackId, false);
    };
  }, [feedbackId]);

  const updatePullProgress = React.useCallback(
    (progress: number) => {
      const next = Math.max(0, Math.min(1, progress));
      pullProgress.current = next;
      setPullProgress(feedbackId, next);
    },
    [feedbackId],
  );

  const onScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isAtTop.current = event.nativeEvent.contentOffset.y <= 0.5;
      if (!isAtTop.current) {
        updatePullProgress(0);
      }
    },
    [updatePullProgress],
  );

  const cancelPull = React.useCallback(() => {
    touchStartY.current = undefined;
    updatePullProgress(0);
  }, [updatePullProgress]);

  const finishPull = React.useCallback(() => {
    const shouldRefresh =
      enabledRef.current &&
      !refreshingRef.current &&
      pullProgress.current >= 1;
    cancelPull();
    if (!shouldRefresh) return;

    showRefresh();
    scheduleRefreshHide();
    onRefreshRef.current();
  }, [cancelPull, scheduleRefreshHide, showRefresh]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_event, gestureState) => {
          const capture =
            enabledRef.current &&
            !refreshingRef.current &&
            isAtTop.current &&
            gestureState.dy > 2 &&
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
          return capture;
        },
        onPanResponderGrant: () => {
          updatePullProgress(0);
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!isAtTop.current) {
            cancelPull();
            return;
          }
          updatePullProgress((gestureState.dy - 8) / 88);
        },
        onPanResponderRelease: finishPull,
        onPanResponderTerminate: cancelPull,
        onPanResponderTerminationRequest: () => false,
      }),
    [cancelPull, finishPull, updatePullProgress],
  );
  const handleTouchStart = React.useCallback(
    (event: GestureResponderEvent) => {
      touchStartY.current =
        enabledRef.current && !refreshingRef.current && isAtTop.current
          ? event.nativeEvent.pageY
          : undefined;
      updatePullProgress(0);
    },
    [updatePullProgress],
  );
  const handleTouchMove = React.useCallback(
    (event: GestureResponderEvent) => {
      if (touchStartY.current === undefined || !isAtTop.current) return;
      updatePullProgress(
        (event.nativeEvent.pageY - touchStartY.current - 8) / 88,
      );
    },
    [updatePullProgress],
  );
  const gestureHandlers = React.useMemo(
    () => ({
      ...panResponder.panHandlers,
      onTouchStartCapture: handleTouchStart,
      onTouchMoveCapture: handleTouchMove,
      onTouchEndCapture: finishPull,
      onTouchCancelCapture: cancelPull,
    }),
    [cancelPull, finishPull, handleTouchMove, handleTouchStart, panResponder.panHandlers],
  );
  const scrollProps = React.useMemo(
    () => ({
      onScroll,
      scrollEventThrottle: 16,
      overScrollMode: 'never' as const,
      alwaysBounceVertical: true,
    }),
    [onScroll],
  );

  return React.useMemo(
    () => ({gestureHandlers, scrollProps}),
    [gestureHandlers, scrollProps],
  );
}

export function RefreshIndicatorHost() {
  const snapshot = React.useSyncExternalStore(
    subscribe,
    getRefreshSnapshot,
    getRefreshSnapshot,
  );
  const refreshCount = Math.floor(snapshot / 101);
  const pullProgress = (snapshot % 101) / 100;
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [visible, setVisible] = React.useState(false);
  const shownAt = React.useRef(0);
  const wasRefreshing = React.useRef(false);

  React.useEffect(() => {
    if (refreshCount > 0) {
      if (!wasRefreshing.current) shownAt.current = Date.now();
      wasRefreshing.current = true;
      setVisible(true);
      return;
    }
    if (pullProgress > 0) {
      setVisible(true);
      return;
    }
    if (!visible) return;
    if (!wasRefreshing.current) {
      setVisible(false);
      return;
    }
    const remaining = Math.max(
      0,
      MIN_REFRESH_ACTIVE_MS - (Date.now() - shownAt.current),
    );
    const timeout = setTimeout(() => {
      wasRefreshing.current = false;
      setVisible(false);
    }, remaining);
    return () => clearTimeout(timeout);
  }, [pullProgress, refreshCount, visible]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel={
        refreshCount > 0
          ? 'Refreshing this page'
          : pullProgress >= 1
            ? 'Release to refresh'
            : 'Pull to refresh'
      }
      accessibilityLiveRegion="polite"
      style={[
        styles.host,
        {top: insets.top + 8, shadowColor: theme.colors.navy},
      ]}>
      <RefreshPill
        pullProgress={pullProgress}
        refreshing={refreshCount > 0}
      />
    </View>
  );
}

function RefreshPill({
  pullProgress,
  refreshing,
}: {
  pullProgress: number;
  refreshing: boolean;
}) {
  const theme = useTheme();
  const entrance = React.useRef(new Animated.Value(0)).current;
  const releaseReady = !refreshing && pullProgress >= 1;

  React.useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      damping: 16,
      stiffness: 180,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });
  const scale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  return (
    <Animated.View
      style={[
        styles.refreshPill,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.progressTrack,
          opacity: entrance,
          transform: [{translateY}, {scale}],
        },
      ]}>
      <RefreshingStudyStack
        pullProgress={pullProgress}
        refreshing={refreshing}
      />
      <View style={styles.copy}>
        <AppText weight="800" size={11.5} color={theme.colors.navy}>
          {refreshing
            ? 'Refreshing your page'
            : releaseReady
              ? 'Release to refresh'
              : 'Pull to refresh'}
        </AppText>
        <AppText size={9} color={theme.colors.text2}>
          {refreshing
            ? 'Bringing in the latest lessons'
            : releaseReady
              ? 'Let go to update your learning'
              : 'Keep pulling to check for updates'}
        </AppText>
        <View style={styles.progressTrack}>
          {refreshing ? (
            <RefreshProgress />
          ) : (
            <View
              style={[
                styles.pullProgress,
                {
                  backgroundColor: releaseReady
                    ? theme.colors.orange
                    : theme.colors.primary,
                  width: `${Math.round(Math.min(1, pullProgress) * 100)}%`,
                },
              ]}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function RefreshingStudyStack({
  pullProgress,
  refreshing,
}: {
  pullProgress: number;
  refreshing: boolean;
}) {
  const theme = useTheme();
  const shuffle = React.useRef(new Animated.Value(0)).current;
  const pencil = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animations = [
      Animated.loop(
        Animated.timing(shuffle, {
          toValue: 1,
          duration: 1050,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        {iterations: -1, resetBeforeIteration: true},
      ),
      Animated.loop(
        Animated.timing(pencil, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        {iterations: -1, resetBeforeIteration: true},
      ),
    ];
    animations.forEach(animation => animation.start());
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduceMotion => {
        if (!mounted || !reduceMotion) return;
        animations.forEach(animation => animation.stop());
        shuffle.setValue(0.2);
        pencil.setValue(0.55);
      });
    return () => {
      mounted = false;
      animations.forEach(animation => animation.stop());
    };
  }, [pencil, shuffle]);

  const cardTranslateX = shuffle.interpolate({
    inputRange: [0, 0.42, 0.58, 1],
    outputRange: [0, 7, -2, 0],
  });
  const cardTranslateY = shuffle.interpolate({
    inputRange: [0, 0.42, 0.58, 1],
    outputRange: [0, -8, 2, 0],
  });
  const cardRotate = shuffle.interpolate({
    inputRange: [0, 0.42, 0.58, 1],
    outputRange: ['-2deg', '5deg', '-4deg', '-2deg'],
  });
  const cardScale = shuffle.interpolate({
    inputRange: [0, 0.42, 0.58, 1],
    outputRange: [1, 1.04, 0.98, 1],
  });
  const pencilTranslateX = pencil.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 31],
  });
  const pencilTranslateY = pencil.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -2, 0],
  });

  return (
    <View
      style={[
        styles.studyStack,
        {
          opacity: refreshing ? 1 : 0.62 + pullProgress * 0.38,
          transform: [
            {translateY: refreshing ? 0 : 4 - pullProgress * 4},
            {scale: refreshing ? 1 : 0.9 + pullProgress * 0.1},
          ],
        },
      ]}>
      <View
        style={[
          styles.studyCardBack,
          {backgroundColor: theme.colors.pastel.blue, borderColor: theme.colors.primary},
        ]}
      />
      <View
        style={[
          styles.studyCardMiddle,
          {backgroundColor: theme.colors.pastel.cream, borderColor: theme.colors.orange},
        ]}
      />
      <Animated.View
        style={[
          styles.studyCardFront,
          {
            backgroundColor: theme.colors.white,
            borderColor: theme.colors.progressTrack,
            transform: [
              {translateX: cardTranslateX},
              {translateY: cardTranslateY},
              {rotate: cardRotate},
              {scale: cardScale},
            ],
          },
        ]}>
        <View style={[styles.studyCardTab, {backgroundColor: theme.colors.primary}]} />
        <View style={styles.studyLineLong} />
        <View style={styles.studyLineMedium} />
        <View style={styles.studyLineShort} />
        <Animated.View
          style={[
            styles.pencil,
            {
              backgroundColor: theme.colors.orange,
              transform: [
                {translateX: pencilTranslateX},
                {translateY: pencilTranslateY},
                {rotate: '-13deg'},
              ],
            },
          ]}>
          <View style={[styles.pencilTip, {backgroundColor: theme.colors.navy}]} />
        </Animated.View>
      </Animated.View>
      <View style={[styles.stackPin, {backgroundColor: theme.colors.orange}]} />
    </View>
  );
}

function RefreshProgress() {
  const theme = useTheme();
  const travel = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(travel, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
      {iterations: -1, resetBeforeIteration: true},
    );
    animation.start();
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduceMotion => {
        if (!mounted || !reduceMotion) return;
        animation.stop();
        travel.setValue(0.5);
      });
    return () => {
      mounted = false;
      animation.stop();
    };
  }, [travel]);

  const translateX = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [-38, 118],
  });

  return (
    <Animated.View
      style={[
        styles.progressSweep,
        {
          backgroundColor: theme.colors.primary,
          transform: [{translateX}],
        },
      ]}>
      <View style={[styles.progressTip, {backgroundColor: theme.colors.orange}]} />
    </Animated.View>
  );
}

const styles = createThemedStyles({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 20,
    alignItems: 'center',
  },
  refreshPill: {
    minWidth: 244,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingLeft: 11,
    paddingRight: 15,
    borderWidth: 1,
    borderRadius: 19,
    boxShadow: '0 10px 26px rgba(26, 35, 126, 0.2)',
  },
  copy: {gap: 2},
  progressTrack: {
    width: 118,
    height: 3,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#DCE8F5',
    marginTop: 3,
  },
  progressSweep: {width: 38, height: 3, borderRadius: 3},
  progressTip: {position: 'absolute', right: 0, width: 9, height: 3, borderRadius: 3},
  pullProgress: {height: 3, borderRadius: 3},
  studyStack: {width: 52, height: 43},
  studyCardBack: {
    position: 'absolute', left: 5, top: 7, width: 41, height: 31,
    borderWidth: 0.8, borderRadius: 7, transform: [{rotate: '-7deg'}], opacity: 0.85,
  },
  studyCardMiddle: {
    position: 'absolute', left: 7, top: 6, width: 41, height: 31,
    borderWidth: 0.8, borderRadius: 7, transform: [{rotate: '6deg'}], opacity: 0.9,
  },
  studyCardFront: {
    position: 'absolute', left: 6, top: 4, width: 41, height: 31,
    paddingTop: 7, paddingHorizontal: 6, gap: 3,
    borderWidth: 0.8, borderRadius: 7,
    boxShadow: '0 4px 8px rgba(26, 35, 126, 0.16)',
  },
  studyCardTab: {position: 'absolute', top: 0, left: 7, width: 13, height: 4, borderBottomLeftRadius: 3, borderBottomRightRadius: 3},
  studyLineLong: {width: 26, height: 1.5, borderRadius: 2, backgroundColor: '#CBD8E8'},
  studyLineMedium: {width: 21, height: 1.5, borderRadius: 2, backgroundColor: '#CBD8E8'},
  studyLineShort: {width: 14, height: 1.5, borderRadius: 2, backgroundColor: '#CBD8E8'},
  pencil: {position: 'absolute', left: 2, bottom: 5, width: 13, height: 3, borderRadius: 2},
  pencilTip: {position: 'absolute', right: -3, top: 0.5, width: 4, height: 2, borderTopRightRadius: 2, borderBottomRightRadius: 2},
  stackPin: {position: 'absolute', right: 1, top: 3, width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: '#FFFFFF'},
});
