import {createThemedStyles} from '../../theme';
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Gradient} from './Gradient';

export function ClayToggle({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{checked: value, disabled: Boolean(disabled)}}
      disabled={disabled || !onValueChange}
      onPress={() => onValueChange?.(!value)}
      hitSlop={6}
      style={({pressed}) => [styles.tgl, disabled && styles.disabled, pressed && styles.pressed]}>
      {value ? <Gradient colors={['#66BB6A', '#43A047']} style={StyleSheet.absoluteFill} /> : null}
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = createThemedStyles({
  tgl: {
    width: 44,
    height: 25,
    borderRadius: 99,
    justifyContent: 'center',
    backgroundColor: '#E2E8F2',
    boxShadow: 'inset 2px 2px 5px rgba(148,163,184,0.5), inset -1px -1px 3px rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginLeft: 3,
    boxShadow: '0 3px 6px -1px rgba(100,116,139,0.5), inset 1px 1px 2px rgba(255,255,255,0.9)',
  },
  knobOn: {marginLeft: 21},
  disabled: {opacity: 0.45},
  pressed: {opacity: 0.88},
});
