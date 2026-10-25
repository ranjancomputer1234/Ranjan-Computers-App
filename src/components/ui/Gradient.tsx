import {createThemedStyles} from '../../theme';
import React from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';

type Props = {
  colors: readonly string[];
  start?: {x: number; y: number};
  end?: {x: number; y: number};
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Native background gradient. An SVG fill on every banner and button was an
 * extra compositing layer, which shows up as stutter on 90/120 Hz panels.
 */
function linearGradientImage(
  colors: readonly string[],
  start: {x: number; y: number},
  end: {x: number; y: number},
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
  const normalized = ((angle % 360) + 360) % 360;
  const stops = colors
    .map((color, index) => {
      const offset = colors.length === 1 ? 0 : (index / (colors.length - 1)) * 100;
      return `${color} ${offset}%`;
    })
    .join(', ');
  return `linear-gradient(${normalized}deg, ${stops})`;
}

export function Gradient({colors, start = {x: 0, y: 0}, end = {x: 0, y: 1}, style, children}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        style,
        {experimental_backgroundImage: linearGradientImage(colors, start, end)},
      ]}>
      {children}
    </View>
  );
}

const styles = createThemedStyles({
  wrap: {overflow: 'hidden'},
});
