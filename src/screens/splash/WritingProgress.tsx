import React from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Point = {x: number; y: number};

/**
 * One handwritten underline. The pen nib is placed from the same curve, so the
 * tip stays on the ink as the stroke is drawn.
 */
const CURVES: [Point, Point, Point, Point][] = [
  [{x: 8, y: 20}, {x: 22, y: 20}, {x: 36, y: 12}, {x: 54, y: 16}],
  [{x: 54, y: 16}, {x: 70, y: 20}, {x: 80, y: 26}, {x: 100, y: 18}],
  [{x: 100, y: 18}, {x: 118, y: 11}, {x: 128, y: 9}, {x: 148, y: 15}],
  [{x: 148, y: 15}, {x: 162, y: 20}, {x: 170, y: 22}, {x: 180, y: 13}],
];

const INK_PATH = 'M8 20C22 20 36 12 54 16C70 20 80 26 100 18C118 11 128 9 148 15C162 20 170 22 180 13';

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function buildStroke() {
  const points: Point[] = [];
  CURVES.forEach(curve => {
    for (let step = 0; step < 20; step += 1) points.push(cubic(curve[0], curve[1], curve[2], curve[3], step / 20));
  });
  points.push(CURVES[CURVES.length - 1][3]);

  const traveled = [0];
  for (let index = 1; index < points.length; index += 1) {
    traveled.push(traveled[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
  }
  const total = traveled[traveled.length - 1];
  const frames = 16;
  const samples: Point[] = [];
  for (let frame = 0; frame <= frames; frame += 1) {
    const target = (frame / frames) * total;
    let index = 1;
    while (index < traveled.length - 1 && traveled[index] < target) index += 1;
    const span = traveled[index] - traveled[index - 1] || 1;
    const mix = (target - traveled[index - 1]) / span;
    samples.push({
      x: points[index - 1].x + (points[index].x - points[index - 1].x) * mix,
      y: points[index - 1].y + (points[index].y - points[index - 1].y) * mix,
    });
  }
  return {length: total + 2, samples};
}

const STROKE = buildStroke();
const NIB_ORIGIN = {x: 6, y: 30};

function WritingPen() {
  return (
    <Svg width={34} height={34} viewBox="-6 -30 34 34">
      <Circle cx={1} cy={1.4} r={2.4} fill="rgba(2,12,40,0.22)" />
      <Path d="M0 0 L6.4 -5.4 L4.2 -7.8 Z" fill="#E7EEF5" />
      <Path d="M0.2 0 L3.4 -2.8" stroke="#8AA0B5" strokeWidth={0.7} />
      <Circle cx={0.2} cy={0.15} r={1.05} fill="#172033" />
      <Path d="M5 -6.4 L16.4 -19" stroke="#FFF8EE" strokeWidth={3.3} strokeLinecap="round" />
      <Path d="M6.2 -8.4 L8.4 -10.6" stroke="rgba(255,255,255,0.85)" strokeWidth={1.1} strokeLinecap="round" />
      <Path d="M10 -12 L13.2 -15.4" stroke="#FFE08A" strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M15 -17.6 L23 -26.2" stroke="#F4EFE4" strokeWidth={3.3} strokeLinecap="round" />
      <Circle cx={23.6} cy={-26.8} r={1.55} fill="#E8B43C" />
    </Svg>
  );
}

type Props = {
  progress: Animated.Value;
};

export function WritingProgress({progress}: Props) {
  const motion = React.useMemo(() => {
    const times = STROKE.samples.map((_, index) => index / (STROKE.samples.length - 1));
    const dashOffset = progress.interpolate({inputRange: [0, 1], outputRange: [STROKE.length, 0]});
    const nibX = progress.interpolate({inputRange: times, outputRange: STROKE.samples.map(point => point.x)});
    const nibY = progress.interpolate({inputRange: times, outputRange: STROKE.samples.map(point => point.y)});
    return {
      dashOffset,
      penX: Animated.subtract(nibX, NIB_ORIGIN.x),
      penY: Animated.subtract(nibY, NIB_ORIGIN.y),
    };
  }, [progress]);

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.stage}>
      <Svg width={188} height={34} viewBox="0 0 188 34">
        <AnimatedPath
          d={INK_PATH}
          fill="none"
          stroke="rgba(255,215,101,0.28)"
          strokeWidth={4.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${STROKE.length} ${STROKE.length}`}
          strokeDashoffset={motion.dashOffset}
        />
        <AnimatedPath
          d={INK_PATH}
          fill="none"
          stroke="#FFD765"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${STROKE.length} ${STROKE.length}`}
          strokeDashoffset={motion.dashOffset}
        />
      </Svg>
      <Animated.View style={[styles.pen, {transform: [{translateX: motion.penX}, {translateY: motion.penY}]}]}>
        <WritingPen />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {width: 188, height: 34, marginTop: 14, overflow: 'visible'},
  pen: {position: 'absolute', left: 0, top: 0, width: 34, height: 34},
});
