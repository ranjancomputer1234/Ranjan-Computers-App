import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RediLogo} from '../../assets/illustrations';
import {Icon, type IconName} from '../../assets/icons';
import {AppText} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {brand, colors, fonts} from '../../theme';
import {SplashDeskBackdrop} from './SplashDeskBackdrop';
import {WritingProgress} from './WritingProgress';

type Props = {
  ready: boolean;
  onFinish: () => void;
};

type LearningChipProps = {
  icon: IconName;
  color: string;
  style: object;
};

function LearningChip({icon, color, style}: LearningChipProps) {
  return (
    <View style={[styles.learningChip, style]}>
      <Icon name={icon} size={20} color={color} strokeWidth={2.2} />
    </View>
  );
}

/**
 * A short, branded bridge between the native launch screen and restored app state.
 * The exit waits for both the intro and session hydration, preventing auth-screen flashes.
 */
export function SplashScreen({ready, onFinish}: Props) {
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const compact = height < 690;
  const entrance = React.useRef(new Animated.Value(0)).current;
  const copyEntrance = React.useRef(new Animated.Value(0)).current;
  const detailsEntrance = React.useRef(new Animated.Value(0)).current;
  const progress = React.useRef(new Animated.Value(0)).current;
  const float = React.useRef(new Animated.Value(0)).current;
  const screenOpacity = React.useRef(new Animated.Value(1)).current;
  const screenScale = React.useRef(new Animated.Value(1)).current;
  const [introDone, setIntroDone] = React.useState(false);
  const exitStarted = React.useRef(false);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    const logoReveal = Animated.spring(entrance, {
      toValue: 1,
      delay: 110,
      speed: 11,
      bounciness: 8,
      useNativeDriver: true,
    });
    const copyReveal = Animated.timing(copyEntrance, {
      toValue: 1,
      delay: 380,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const detailsReveal = Animated.timing(detailsEntrance, {
      toValue: 1,
      delay: 660,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const progressReveal = Animated.timing(progress, {
      toValue: 1,
      delay: 700,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const reveals = [logoReveal, copyReveal, detailsReveal, progressReveal];
    reveals.forEach(animation => animation.start());

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();

    let intro = Animated.delay(1480);
    intro.start(({finished}) => finished && mounted.current && setIntroDone(true));

    // Querying this setting crosses the native bridge. Start the reveal immediately
    // so slow debug devices never show an empty frame, then settle instantly if needed.
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduceMotion => {
        if (!reduceMotion || !mounted.current) return;
        reveals.forEach(animation => animation.stop());
        floatLoop.stop();
        intro.stop();
        entrance.setValue(1);
        copyEntrance.setValue(1);
        detailsEntrance.setValue(1);
        progress.setValue(1);
        intro = Animated.delay(450);
        intro.start(({finished}) => finished && mounted.current && setIntroDone(true));
      });

    return () => {
      mounted.current = false;
      reveals.forEach(animation => animation.stop());
      intro.stop();
      floatLoop.stop();
    };
  }, [copyEntrance, detailsEntrance, entrance, float, progress]);

  React.useEffect(() => {
    if (!ready || !introDone || exitStarted.current) return;
    exitStarted.current = true;

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        delay: 90,
        duration: 320,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1.035,
        delay: 90,
        duration: 320,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({finished}) => finished && onFinish());
  }, [introDone, onFinish, ready, screenOpacity, screenScale]);

  const lift = entrance.interpolate({inputRange: [0, 1], outputRange: [28, 0]});
  const logoScale = entrance.interpolate({inputRange: [0, 0.72, 1], outputRange: [0.56, 1.08, 1]});
  const copyLift = copyEntrance.interpolate({inputRange: [0, 1], outputRange: [18, 0]});
  const detailLift = detailsEntrance.interpolate({inputRange: [0, 1], outputRange: [12, 0]});
  const chipLift = float.interpolate({inputRange: [0, 1], outputRange: [0, -8]});
  const chipDrop = float.interpolate({inputRange: [0, 1], outputRange: [-5, 3]});
  const stageSize = compact ? 224 : 262;
  const logoSize = compact ? 94 : 110;

  return (
    <Animated.View
      accessibilityLabel={`${brand.institute}. ${brand.tagline}`}
      accessibilityRole="summary"
      style={[styles.screen, {opacity: screenOpacity, transform: [{scale: screenScale}]}]}>
      <StatusBar barStyle="light-content" />
      <Gradient
        colors={['#071838', '#0D3D86', '#1976D2']}
        start={{x: 0.05, y: 0}}
        end={{x: 0.95, y: 1}}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.backdrop}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
        <SplashDeskBackdrop compact={compact} drift={float} />
      </View>

      <View
        style={[
          styles.safeContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}>
        <View style={styles.topLabel}>
          <View style={styles.topLabelLine} />
          <AppText weight="800" size={10} color="rgba(255,255,255,0.72)" style={styles.topLabelText}>
            YOUR LEARNING JOURNEY
          </AppText>
          <View style={styles.topLabelLine} />
        </View>

        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.stage,
              {width: stageSize, height: stageSize, opacity: entrance, transform: [{translateY: lift}, {scale: logoScale}]},
            ]}>
            <View style={[styles.orbit, {width: stageSize - 24, height: stageSize - 24, borderRadius: stageSize}]} />
            <View style={[styles.orbit, styles.innerOrbit, {width: stageSize - 72, height: stageSize - 72, borderRadius: stageSize}]} />
            <View style={styles.logoGlow} />
            <View style={styles.logoShell}>
              <RediLogo size={logoSize} />
            </View>

            <Animated.View style={[styles.chipTopLeft, {transform: [{translateY: chipLift}]}]}>
              <LearningChip icon="bulb" color="#F9A825" style={styles.chipGold} />
            </Animated.View>
            <Animated.View style={[styles.chipRight, {transform: [{translateY: chipDrop}]}]}>
              <LearningChip icon="bookopen" color="#1976D2" style={styles.chipBlue} />
            </Animated.View>
            <Animated.View style={[styles.chipBottomLeft, {transform: [{translateY: chipDrop}]}]}>
              <LearningChip icon="target" color="#2E7D32" style={styles.chipGreen} />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.brandCopy, {opacity: copyEntrance, transform: [{translateY: copyLift}]}]}>
            <AppText weight="900" size={compact ? 38 : 44} color="#FFFFFF" center style={styles.wordmark}>
              {brand.name}
            </AppText>
            <AppText weight="700" size={compact ? 14 : 16} color="#FFFFFF" center style={styles.institute}>
              {brand.institute}
            </AppText>
            <View style={styles.taglineRow}>
              <View style={styles.taglineDot} />
              <AppText weight="700" size={compact ? 10 : 11} color="#FFD765" center style={styles.tagline}>
                LEARN COMPUTER WITH AI
              </AppText>
              <View style={styles.taglineDot} />
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, {opacity: detailsEntrance, transform: [{translateY: detailLift}]}]}>
          <WritingProgress progress={progress} />
          <AppText weight="600" size={10} color="rgba(255,255,255,0.7)" center style={styles.preparing}>
            Preparing your classroom…
          </AppText>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = createThemedStyles({
  screen: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0D3D86',
    overflow: 'hidden',
  },
  backdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden'},
  glow: {position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(85, 174, 255, 0.16)'},
  glowTop: {width: 280, height: 280, right: -160, top: -120},
  glowBottom: {width: 340, height: 340, left: -180, bottom: -170, backgroundColor: 'rgba(255, 196, 92, 0.12)'},
  safeContent: {flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 24},
  topLabel: {height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  topLabelLine: {width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.3)'},
  topLabelText: {fontFamily: fonts.inter, letterSpacing: 2.1},
  centerContent: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  stage: {alignItems: 'center', justifyContent: 'center'},
  orbit: {position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)'},
  innerOrbit: {borderColor: 'rgba(255,213,101,0.18)', borderStyle: 'dashed'},
  logoGlow: {position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)'},
  logoShell: {
    padding: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    boxShadow: '0 20px 40px rgba(1,14,47,0.38)',
  },
  learningChip: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    boxShadow: '0 12px 22px rgba(1,14,47,0.28)',
  },
  chipTopLeft: {position: 'absolute', top: 24, left: 18},
  chipRight: {position: 'absolute', right: 4, top: '46%'},
  chipBottomLeft: {position: 'absolute', left: 25, bottom: 20},
  chipGold: {backgroundColor: '#FFF8E1'},
  chipBlue: {backgroundColor: '#E3F2FD'},
  chipGreen: {backgroundColor: '#E8F5E9'},
  brandCopy: {alignItems: 'center', marginTop: 4},
  wordmark: {fontFamily: fonts.inter, lineHeight: 52, letterSpacing: 8, marginLeft: 8},
  institute: {fontFamily: fonts.inter, lineHeight: 22, letterSpacing: 0.15},
  taglineRow: {marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9},
  taglineDot: {width: 4, height: 4, borderRadius: 2, backgroundColor: colors.orange},
  tagline: {fontFamily: fonts.inter, letterSpacing: 0.55},
  footer: {alignItems: 'center', minHeight: 78, gap: 6},
  preparing: {fontFamily: fonts.inter, letterSpacing: 0.4},
});
