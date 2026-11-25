import React from 'react';
import {AccessibilityInfo, Animated, Easing, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppText} from '../../components/ui';
import {translateUiString} from '../../features/settings/uiTranslations';

const SEGMENTS = 16;
const PHRASES = ['powering on', 'loading modules', 'opening classroom'] as const;

type Props = {
  progress: Animated.Value;
  compact?: boolean;
};

/**
 * Laptop boot panel for the splash footer. The rail fills with session startup,
 * while a scan keeps the display feeling live until the splash exits.
 */
export function ComputerBootBar({progress, compact = false}: Props) {
  const {i18n} = useTranslation();
  const led = React.useRef(new Animated.Value(0.4)).current;
  const cursor = React.useRef(new Animated.Value(1)).current;
  const sweep = React.useRef(new Animated.Value(0)).current;
  const scan = React.useRef(new Animated.Value(0)).current;
  const phraseOpacity = React.useRef(new Animated.Value(1)).current;
  const [phrase, setPhrase] = React.useState<(typeof PHRASES)[number] | 'system ready'>(PHRASES[0]);
  const [percent, setPercent] = React.useState(0);
  const [railWidth, setRailWidth] = React.useState(0);
  const mounted = React.useRef(true);
  const booted = React.useRef(false);
  const allowMotion = React.useRef(true);

  const cells = React.useMemo(
    () =>
      Array.from({length: SEGMENTS}, (_, index) => {
        const start = index / SEGMENTS;
        const end = Math.min(1, (index + 0.82) / SEGMENTS);
        return progress.interpolate({
          inputRange: [start, end === start ? start + 0.001 : end],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });
      }),
    [progress],
  );

  const glow = React.useMemo(
    () => progress.interpolate({inputRange: [0, 1], outputRange: [0.2, 0.85], extrapolate: 'clamp'}),
    [progress],
  );

  const headX = React.useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(railWidth - 14, 0)],
        extrapolate: 'clamp',
      }),
    [progress, railWidth],
  );

  const sweepX = React.useMemo(
    () => sweep.interpolate({inputRange: [0, 1], outputRange: [-40, Math.max(railWidth, 1)]}),
    [railWidth, sweep],
  );

  const scanY = React.useMemo(
    () => scan.interpolate({inputRange: [0, 1], outputRange: [-16, compact ? 72 : 86]}),
    [compact, scan],
  );

  React.useEffect(() => {
    mounted.current = true;
    const ledLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(led, {toValue: 1, duration: 720, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(led, {toValue: 0.38, duration: 720, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    const cursorLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(420),
        Animated.timing(cursor, {toValue: 0, duration: 70, useNativeDriver: true}),
        Animated.delay(280),
        Animated.timing(cursor, {toValue: 1, duration: 70, useNativeDriver: true}),
      ]),
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {toValue: 1, duration: 1280, easing: Easing.linear, useNativeDriver: true}),
    );
    const scanLoop = Animated.loop(
      Animated.timing(scan, {toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true}),
    );
    const loops = [ledLoop, cursorLoop, sweepLoop, scanLoop];
    loops.forEach(loop => loop.start());

    let step = 0;
    const phraseTimer = setInterval(() => {
      if (booted.current) return;
      step += 1;
      if (step >= PHRASES.length) return;
      setPhrase(PHRASES[step]);
    }, 680);

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduceMotion => {
        if (!mounted.current || !reduceMotion) return;
        allowMotion.current = false;
        loops.forEach(loop => loop.stop());
        clearInterval(phraseTimer);
        led.setValue(1);
        cursor.setValue(1);
        sweep.setValue(0);
        scan.setValue(0);
        phraseOpacity.setValue(1);
      });

    return () => {
      mounted.current = false;
      loops.forEach(loop => loop.stop());
      clearInterval(phraseTimer);
    };
  }, [cursor, led, phraseOpacity, scan, sweep]);

  React.useEffect(() => {
    const id = progress.addListener(({value}) => {
      if (!mounted.current) return;
      const next = Math.round(value * 100);
      setPercent(current => (current === next ? current : next));
      if (value < 0.98 || booted.current) return;
      booted.current = true;
      setPhrase('system ready');
    });
    return () => progress.removeListener(id);
  }, [progress]);

  React.useEffect(() => {
    if (!allowMotion.current) return;
    phraseOpacity.setValue(0.2);
    const fade = Animated.timing(phraseOpacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    fade.start();
    return () => fade.stop();
  }, [phrase, phraseOpacity]);

  const language = i18n.resolvedLanguage ?? i18n.language;
  const spoken = translateUiString(phrase, language);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={spoken}
      accessibilityValue={{min: 0, max: 100, now: percent}}
      style={[styles.root, compact ? styles.rootCompact : null]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.chassis}>
      <View style={styles.bezel}>
        <View style={styles.screen}>
          <Animated.View pointerEvents="none" style={[styles.scan, {transform: [{translateY: scanY}]}]} />

          <View style={styles.titleRow}>
            <Animated.View style={[styles.ledRing, {opacity: led}]}>
              <View style={styles.ledCore} />
            </Animated.View>
            <AppText weight="700" size={compact ? 9 : 10} color="#FFD765" face="mono" translate={false} style={styles.sysName}>
              RACI.SYS
            </AppText>
            <View style={styles.titleFill} />
            <AppText weight="700" size={compact ? 9 : 10} color="rgba(255,255,255,0.82)" face="mono" translate={false} style={styles.percent}>
              {`${String(percent).padStart(3, '0')}%`}
            </AppText>
          </View>

          <Animated.View style={[styles.promptRow, {opacity: phraseOpacity}]}>
            <AppText weight="700" size={compact ? 11 : 12} color="#FFD765" face="mono" translate={false}>
              {'>'}
            </AppText>
            <AppText weight="600" size={compact ? 11 : 12} color="rgba(255,255,255,0.9)" style={styles.prompt} numberOfLines={1}>
              {phrase}
            </AppText>
            <Animated.View style={[styles.cursor, {opacity: cursor}]} />
          </Animated.View>

          <View style={styles.railWrap}>
            <Animated.View pointerEvents="none" style={[styles.railGlow, {opacity: glow}]} />
            <View
              style={styles.rail}
              onLayout={event => {
                const next = Math.round(event.nativeEvent.layout.width);
                setRailWidth(current => (current === next ? current : next));
              }}>
              {cells.map((opacity, index) => (
                <View key={index} style={styles.cell}>
                  <Animated.View style={[styles.cellOn, {opacity}]} />
                </View>
              ))}
              <Animated.View pointerEvents="none" style={[styles.sweep, {transform: [{translateX: sweepX}]}]} />
              <Animated.View pointerEvents="none" style={[styles.head, {transform: [{translateX: headX}]}]} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.deck}>
        <View style={styles.hinge}>
          <View style={styles.screw} />
          <View style={styles.screw} />
        </View>
        <View style={styles.foot} />
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {width: '100%', maxWidth: 300, alignSelf: 'center'},
  rootCompact: {maxWidth: 268},
  chassis: {width: '100%'},
  bezel: {
    borderRadius: 16,
    padding: 5,
    backgroundColor: 'rgba(232, 240, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    boxShadow: '0 18px 34px rgba(1, 14, 47, 0.34)',
  },
  screen: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(3, 12, 32, 0.72)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scan: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  ledRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 101, 0.85)',
    backgroundColor: 'rgba(255, 215, 101, 0.14)',
  },
  ledCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD765',
    boxShadow: '0 0 8px #FFD765',
  },
  sysName: {letterSpacing: 1.3},
  titleFill: {flex: 1},
  percent: {minWidth: 42, textAlign: 'right'},
  promptRow: {marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 16},
  prompt: {flexShrink: 1, letterSpacing: 0.2},
  cursor: {width: 7, height: 13, borderRadius: 1, backgroundColor: '#FFD765'},
  railWrap: {marginTop: 10, justifyContent: 'center'},
  railGlow: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 101, 0.45)',
  },
  rail: {
    height: 8,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cell: {flex: 1, height: 8, borderRadius: 1.5, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)'},
  cellOn: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#FFD765'},
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  head: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 12,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: '#FFF6CC',
    boxShadow: '0 0 10px rgba(255, 246, 204, 0.95)',
  },
  deck: {alignItems: 'center', marginTop: -1},
  hinge: {
    width: '58%',
    height: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(226, 236, 255, 0.42)',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.55)',
  },
  screw: {width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(7, 24, 56, 0.45)'},
  foot: {
    width: '30%',
    height: 3,
    marginTop: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(2, 12, 40, 0.28)',
  },
});
