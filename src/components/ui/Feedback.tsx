import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  View,
} from 'react-native';
import {clay, colors, gradients} from '../../theme';
import type {ClayVariant} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {AppText} from './AppText';
import {ClayButton, ClayCard} from './Clay';
import {Gradient} from './Gradient';

export function FilterChip({
  label,
  selected,
  tone = 'plain',
  onPress,
}: {
  label: string;
  selected?: boolean;
  tone?: 'plain' | 'free' | 'paid';
  onPress?: () => void;
}) {
  if (selected) {
    return (
      <Pressable accessibilityRole="button" accessibilityState={{selected: true}} onPress={onPress}>
        <Gradient colors={gradients.primaryButton} style={styles.chip}>
          <AppText weight="700" size={12} color="#fff">
            {label}
          </AppText>
        </Gradient>
      </Pressable>
    );
  }
  const bg = tone === 'free' ? clay.green.bg : tone === 'paid' ? clay.orange.bg : colors.subtle;
  const color = tone === 'free' ? colors.success : tone === 'paid' ? '#EF6C00' : colors.navy;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{selected: false}} onPress={onPress} style={[styles.chip, {backgroundColor: bg}]}>
      <AppText weight="700" size={12} color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function AccessBadge({pricing}: {pricing: 'free' | 'paid' | 'purchased'}) {
  const palette = pricing === 'paid' ? gradients.paidBadge : gradients.freeBadge;
  const label = pricing === 'purchased' ? 'PURCHASED' : pricing.toUpperCase();
  return (
    <Gradient colors={palette} style={styles.badge}>
      <AppText weight="800" size={8.5} color="#fff" style={{letterSpacing: 0.8}}>
        {label}
      </AppText>
    </Gradient>
  );
}

export function ProgressBar({percent, height = 9}: {percent: number; height?: number}) {
  const width = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{min: 0, max: 100, now: width}} style={[styles.track, {height}]}>
      <Gradient colors={gradients.progress} style={{width: `${width}%`, height: '100%', borderRadius: 99}} />
    </View>
  );
}

export function EmptyState({title, body, actionLabel, onAction}: {title: string; body: string; actionLabel?: string; onAction?: () => void}) {
  return (
    <ClayCard variant="sky" style={styles.center}>
      <AppText weight="800" size={16} color={colors.navy} center>
        {title}
      </AppText>
      <AppText size={12.5} color={colors.text2} center>
        {body}
      </AppText>
      {actionLabel ? <ClayButton label={actionLabel} onPress={onAction} compact /> : null}
    </ClayCard>
  );
}

export function ErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
  return <EmptyState title="Couldn’t load this" body={message} actionLabel={onRetry ? 'Retry' : undefined} onAction={onRetry} />;
}

export function Skeleton({height = 72, variant = 'blue' as ClayVariant}) {
  return <View style={{height, borderRadius: 17, backgroundColor: clay[variant].bg, opacity: 0.7}} />;
}

export function LoadingBlock({label = 'Loading content'}: {label?: string}) {
  const theme = useTheme();
  const pageTurn = React.useRef(new Animated.Value(0)).current;
  const breathe = React.useRef(new Animated.Value(0)).current;
  const sweep = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [
      Animated.loop(
        Animated.timing(pageTurn, {
          toValue: 1,
          duration: 1050,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        {iterations: -1, resetBeforeIteration: true},
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, {
            toValue: 1,
            duration: 760,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(breathe, {
            toValue: 0,
            duration: 760,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ];

    animations.forEach(animation => animation.start());
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduceMotion => {
        if (!mounted || !reduceMotion) return;
        animations.forEach(animation => animation.stop());
        pageTurn.setValue(0.42);
        breathe.setValue(0.35);
        sweep.setValue(0.5);
      });

    return () => {
      mounted = false;
      animations.forEach(animation => animation.stop());
    };
  }, [breathe, pageTurn, sweep]);

  const pageRotation = pageTurn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });
  const pageShade = pageTurn.interpolate({
    inputRange: [0, 0.42, 0.5, 0.58, 1],
    outputRange: [0.05, 0.18, 0.32, 0.16, 0.04],
  });
  const bookScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1.025],
  });
  const bookLift = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -2],
  });
  const shadowOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.13, 0.23],
  });

  const dotOpacity = (index: number) => {
    const start = index * 0.18 + 0.01;
    return sweep.interpolate({
      inputRange: [0, start, Math.min(start + 0.2, 0.98), Math.min(start + 0.4, 0.99), 1],
      outputRange: [0.3, 0.3, 1, 0.3, 0.3],
    });
  };

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.loadingBlock}>
      <Animated.View
        style={[
          styles.bookShadow,
          {backgroundColor: theme.colors.deepBlue, opacity: shadowOpacity},
        ]}
      />
      <Animated.View
        style={[
          styles.bookStage,
          {transform: [{translateY: bookLift}, {scale: bookScale}]},
        ]}>
        <View style={[styles.bookCover, {backgroundColor: theme.colors.deepBlue}]} />
        <View style={styles.leftPage}>
          <View style={[styles.pageKicker, {backgroundColor: theme.colors.orange}]} />
          <View style={styles.pageLineLong} />
          <View style={styles.pageLineShort} />
          <View style={styles.pageLineMedium} />
          <View style={[styles.pageNumber, {backgroundColor: theme.colors.primary}]} />
        </View>
        <View style={styles.rightPage}>
          <View style={[styles.pageHeading, {backgroundColor: theme.colors.primary}]} />
          <View style={styles.pageLineMedium} />
          <View style={styles.pageLineLong} />
          <View style={styles.pageLineShort} />
          <View style={styles.answerRow}>
            <View style={[styles.answerDot, {borderColor: theme.colors.orange}]} />
            <View style={styles.answerLine} />
          </View>
        </View>
        <Animated.View
          style={[
            styles.turningPage,
            {transform: [{perspective: 420}, {rotateY: pageRotation}]},
          ]}>
          <View style={styles.turningPageFront}>
            <View style={[styles.pageHeading, {backgroundColor: theme.colors.primary}]} />
            <View style={styles.pageLineLong} />
            <View style={styles.pageLineMedium} />
            <View style={styles.pageLineShort} />
            <Animated.View
              style={[styles.turningPageShade, {opacity: pageShade}]}
            />
          </View>
          <View style={styles.turningPageBack}>
            <View style={[styles.pageKicker, {backgroundColor: theme.colors.orange}]} />
            <View style={styles.pageLineMedium} />
            <View style={styles.pageLineLong} />
            <View style={styles.pageLineShort} />
            <Animated.View
              style={[styles.turningPageShade, {opacity: pageShade}]}
            />
          </View>
        </Animated.View>
        <View style={[styles.bookSpine, {backgroundColor: theme.colors.deepBlue}]} />
        <View style={[styles.bookmark, {backgroundColor: theme.colors.orange}]} />
      </Animated.View>

      <View style={styles.loadingLabelRow}>
        <AppText weight="700" size={11} color={theme.colors.text2} style={styles.loadingLabel}>
          {label}
        </AppText>
        <View style={styles.loadingDots} aria-hidden>
          {[0, 1, 2].map(index => (
            <Animated.View
              key={index}
              style={[styles.loadingDot, {backgroundColor: theme.colors.primary, opacity: dotOpacity(index)}]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function OfflineBanner({visible}: {visible: boolean}) {
  if (!visible) return null;
  return (
    <View style={styles.offline}>
      <AppText size={11} weight="700" color="#fff" center>
        You’re offline. Showing saved content where allowed.
      </AppText>
    </View>
  );
}

const styles = createThemedStyles({
  chip: {minHeight: 48, justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999},
  badge: {alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999},
  track: {flexGrow: 1, minWidth: 0, borderRadius: 99, backgroundColor: colors.progressTrack, overflow: 'hidden'},
  center: {alignItems: 'center', gap: 10, padding: 18},
  loadingBlock: {alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, paddingHorizontal: 12},
  bookShadow: {position: 'absolute', top: 69, width: 74, height: 9, borderRadius: 20, transform: [{scaleX: 1.08}]},
  bookStage: {width: 96, height: 68},
  bookCover: {
    position: 'absolute',
    left: 4,
    top: 9,
    width: 88,
    height: 54,
    borderRadius: 8,
    boxShadow: '0 8px 16px rgba(13, 71, 161, 0.22)',
  },
  leftPage: {
    position: 'absolute', left: 7, top: 5, width: 41, height: 54,
    paddingTop: 10, paddingHorizontal: 7, gap: 5,
    backgroundColor: '#FFFDF7', borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
    borderTopRightRadius: 2, borderBottomRightRadius: 2,
  },
  rightPage: {
    position: 'absolute', left: 48, top: 5, width: 41, height: 54,
    paddingTop: 10, paddingHorizontal: 7, gap: 5,
    backgroundColor: '#FFFFFF', borderTopRightRadius: 8, borderBottomRightRadius: 8,
    borderTopLeftRadius: 2, borderBottomLeftRadius: 2,
  },
  turningPage: {
    position: 'absolute', left: 48, top: 5, width: 41, height: 54,
    transformOrigin: 'left center',
    boxShadow: '-3px 2px 7px rgba(26, 35, 126, 0.16)',
  },
  turningPageFront: {
    position: 'absolute', inset: 0, paddingTop: 10, paddingHorizontal: 7, gap: 5,
    overflow: 'hidden', backgroundColor: '#FFFDF7',
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
    borderTopLeftRadius: 2, borderBottomLeftRadius: 2,
    backfaceVisibility: 'hidden',
  },
  turningPageBack: {
    position: 'absolute', inset: 0, paddingTop: 10, paddingHorizontal: 7, gap: 5,
    overflow: 'hidden', backgroundColor: '#FFFFFF',
    borderTopRightRadius: 2, borderBottomRightRadius: 2,
    borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
    backfaceVisibility: 'hidden', transform: [{rotateY: '180deg'}],
  },
  turningPageShade: {position: 'absolute', inset: 0, backgroundColor: '#0D47A1'},
  bookSpine: {position: 'absolute', left: 46.5, top: 7, width: 3, height: 51, borderRadius: 2, opacity: 0.2},
  bookmark: {position: 'absolute', right: 13, top: 8, width: 4, height: 16, borderBottomLeftRadius: 3, borderBottomRightRadius: 3},
  pageKicker: {width: 13, height: 3, borderRadius: 2, marginBottom: 1},
  pageHeading: {width: 21, height: 4, borderRadius: 2, marginBottom: 1},
  pageLineLong: {width: '100%', height: 2, borderRadius: 2, backgroundColor: '#D7E1EE'},
  pageLineMedium: {width: '78%', height: 2, borderRadius: 2, backgroundColor: '#D7E1EE'},
  pageLineShort: {width: '55%', height: 2, borderRadius: 2, backgroundColor: '#D7E1EE'},
  pageNumber: {position: 'absolute', left: 7, bottom: 6, width: 5, height: 5, borderRadius: 3, opacity: 0.5},
  answerRow: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1},
  answerDot: {width: 5, height: 5, borderRadius: 3, borderWidth: 1},
  answerLine: {width: 14, height: 2, borderRadius: 2, backgroundColor: '#D7E1EE'},
  loadingLabelRow: {minHeight: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5},
  loadingLabel: {letterSpacing: 0.15},
  loadingDots: {flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 2},
  loadingDot: {width: 3, height: 3, borderRadius: 2},
  offline: {backgroundColor: colors.navy, paddingVertical: 8, paddingHorizontal: 12},
});
