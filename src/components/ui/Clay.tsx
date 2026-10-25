import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {clay, clayShadow, colors, iconButtonShadow, insetShadow, radius, space} from '../../theme';
import type {ClayVariant} from '../../theme';
import {Icon, type IconName} from '../../assets/icons';
import {Gradient} from './Gradient';
import {AppText} from './AppText';
import {gradients} from '../../theme';
import {useTranslation} from 'react-i18next';
import {translateUiString} from '../../features/settings/uiTranslations';

type CardProps = {
  variant?: ClayVariant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  padded?: boolean;
};

export function ClayCard({variant = 'white', style, children, onPress, padded = true}: CardProps) {
  const backgroundColor = clay[variant].bg;
  const surface = [styles.card, padded && styles.cardPad, {backgroundColor, boxShadow: clayShadow(variant)}, style];
  if (!onPress) return <View style={surface}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => [surface, {opacity: pressed ? 0.92 : 1}]}>
      {children}
    </Pressable>
  );
}

export function InsetSurface({style, children}: {style?: StyleProp<ViewStyle>; children?: React.ReactNode}) {
  return <View style={[styles.inset, style]}>{children}</View>;
}

export function ClayIconTile({
  icon,
  color,
  letter,
  size = 42,
}: {
  icon?: IconName;
  color?: string;
  letter?: string;
  size?: number;
}) {
  return (
    <View style={[styles.tile, {width: size, height: size, borderRadius: radius.icon}]}>
      {letter ? (
        <AppText weight="900" size={letter.length > 1 ? 12 : 16} color={color ?? colors.primary}>
          {letter}
        </AppText>
      ) : icon ? (
        <Icon name={icon} size={Math.round(size * 0.48)} color={color ?? colors.primary} />
      ) : null}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  dot,
  color = colors.navy,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress?: () => void;
  dot?: boolean;
  color?: string;
  accessibilityLabel: string;
}) {
  const {i18n} = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={translateUiString(accessibilityLabel, i18n.resolvedLanguage ?? i18n.language)}
      disabled={!onPress}
      accessibilityState={{disabled: !onPress}}
      hitSlop={8}
      style={({pressed}) => [styles.iconBtn, pressed && {opacity: 0.8}]}>
      <Icon name={icon} size={17} color={color} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export function ClayButton({
  label,
  onPress,
  tone = 'primary',
  disabled,
  icon,
  compact,
  style,
}: {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'orange' | 'ghost' | 'success';
  disabled?: boolean;
  icon?: IconName;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colorsForTone =
    tone === 'orange' ? gradients.orangeCta : tone === 'success' ? gradients.freeBadge : gradients.primaryButton;
  if (tone === 'ghost') {
    return (
      <Pressable accessibilityRole="button" accessibilityState={{disabled: Boolean(disabled || !onPress)}} onPress={onPress} disabled={disabled || !onPress} style={({pressed}) => [styles.ghost, compact && styles.compact, style, {opacity: disabled ? 0.5 : pressed ? 0.85 : 1}]}>
        <View style={styles.btnRow}>
          {icon ? <Icon name={icon} size={12} color={colors.primary} /> : null}
          <AppText center weight="800" size={compact ? 12 : 14} color={colors.primary}>
            {label}
          </AppText>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityState={{disabled: Boolean(disabled || !onPress)}} onPress={onPress} disabled={disabled || !onPress} style={({pressed}) => [style, {opacity: disabled ? 0.5 : pressed ? 0.9 : 1}]}>
      <Gradient colors={colorsForTone} style={[styles.btn, compact && styles.compact]}>
        <View style={styles.btnRow}>
          {icon ? <Icon name={icon} size={12} color="#fff" /> : null}
          <AppText center weight="800" size={compact ? 12 : 14} color="#fff" style={{flexShrink: 1}}>
            {label}
          </AppText>
        </View>
      </Gradient>
    </Pressable>
  );
}

const styles = createThemedStyles({
  card: {
    borderRadius: radius.card,
    minWidth: 0,
  },
  cardPad: {padding: 11, gap: 10},
  inset: {
    backgroundColor: colors.pressed,
    borderRadius: radius.search,
    paddingVertical: 13,
    paddingHorizontal: 15,
    boxShadow: insetShadow(),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tile: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 3px 3px 7px rgba(255,255,255,0.95), inset -3px -3px 7px rgba(100,116,139,0.24), 5px 6px 12px -6px rgba(26,35,126,0.32)',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: iconButtonShadow(),
  },
  dot: {
    position: 'absolute',
    top: 7,
    right: 7.5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  btn: {minHeight: space.hit, justifyContent: 'center', borderRadius: 999, paddingVertical: 11, paddingHorizontal: 16},
  compact: {minHeight: space.hit, justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 11},
  btnRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  ghost: {
    minHeight: space.hit,
    justifyContent: 'center',
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#64B5F6',
  },
});
