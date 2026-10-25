import {createThemedStyles} from '../../theme';
import React, {useId} from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient as SvgLinearGradient, Rect, Stop} from 'react-native-svg';

type Props = {
  colors: readonly string[];
  start?: {x: number; y: number};
  end?: {x: number; y: number};
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function Gradient({colors, start = {x: 0, y: 0}, end = {x: 0, y: 1}, style, children}: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = `g${rawId}`;
  return (
    <View style={[styles.wrap, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id={id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
              {colors.map((color, index) => (
                <Stop
                  key={`${color}-${index}`}
                  offset={colors.length === 1 ? '0' : `${(index / (colors.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = createThemedStyles({
  wrap: {overflow: 'hidden'},
});
