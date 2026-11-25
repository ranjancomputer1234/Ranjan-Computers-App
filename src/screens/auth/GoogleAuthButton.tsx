import React from 'react';
import {Pressable} from 'react-native';
import {GoogleLogo} from '../../assets/GoogleLogo';
import {AppText} from '../../components/ui';
import {colors} from '../../theme';
import {styles} from './styles';

type GoogleAuthButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function GoogleAuthButton({label, disabled, onPress}: GoogleAuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled: Boolean(disabled)}}
      style={({pressed}) => [styles.googleButton, pressed && styles.pressed, disabled && styles.disabled]}>
      <GoogleLogo size={18} />
      <AppText weight="600" size={15} color={colors.ink}>{label}</AppText>
    </Pressable>
  );
}
