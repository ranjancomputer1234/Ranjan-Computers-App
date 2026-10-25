import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, fonts, insetShadow, radius } from '../../theme';
import { Icon } from '../../assets/icons';
import { AppText } from './AppText';
import {useTranslation} from 'react-i18next';
import {translateUiString} from '../../features/settings/uiTranslations';

type SearchProps = {
  value?: string;
  placeholder: string;
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  onMic?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
  onSubmitEditing?: () => void;
  /** Uses a restrained outlined surface instead of the inset clay treatment. */
  flat?: boolean;
};

export function SearchInput({
  value,
  placeholder,
  onPress,
  onChangeText,
  onClear,
  onMic,
  autoFocus,
  editable = true,
  onSubmitEditing,
  flat = false,
}: SearchProps) {
  const [focused, setFocused] = React.useState(false);
  const {i18n} = useTranslation();
  const tx = (text: string) => translateUiString(text, i18n.resolvedLanguage ?? i18n.language);

  if (onPress && !onChangeText) {
    return (
      <Pressable onPress={onPress} accessibilityRole="search">
        <View style={[styles.search, flat && styles.searchFlat]}>
          <Icon name="search" size={17} color={colors.text3} />
          <AppText size={12.5} color={colors.text3} style={styles.flex}>
            {placeholder}
          </AppText>
        </View>
      </Pressable>
    );
  }
  return (
    <View
      style={[
        styles.search,
        flat && styles.searchFlat,
        focused && (flat ? styles.searchFlatFocused : styles.searchFocused),
      ]}>
      <Icon
        name="search"
        size={17}
        color={focused ? colors.primary : colors.text3}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={tx(placeholder)}
        placeholderTextColor={colors.text3}
        autoFocus={autoFocus}
        editable={editable}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {value ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityLabel="Clear search"
        >
          <AppText size={12} weight="700" color={colors.text2}>
            Clear
          </AppText>
        </Pressable>
      ) : null}
      {onMic ? (
        <Pressable
          onPress={onMic}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voice search"
        >
          <Icon name="mic" size={16} color={colors.text3} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function FormField({
  label,
  error,
  icon,
  prefix,
  hint,
  onPress,
  ...rest
}: TextInputProps & {
  label?: string;
  error?: string;
  icon?: import('../../assets/icons').IconName;
  prefix?: string;
  hint?: string;
  onPress?: () => void;
}) {
  const {i18n} = useTranslation();
  const tx = (text?: string) => text ? translateUiString(text, i18n.resolvedLanguage ?? i18n.language) : text;
  const editable = rest.editable !== false && !onPress;
  const field = (
    <View style={[styles.fieldRow, !editable && styles.fieldReadonly]}>
      {icon ? <Icon name={icon} size={15} color={colors.text3} /> : null}
      {prefix ? (
        <AppText weight="800" size={13} color={colors.navy}>
          {prefix}
        </AppText>
      ) : null}
      <TextInput
        accessibilityLabel={tx(label ?? rest.placeholder)}
        {...rest}
        placeholder={tx(rest.placeholder)}
        editable={editable}
        placeholderTextColor={colors.text3}
        style={[styles.fieldInner, rest.style]}
        pointerEvents={onPress ? 'none' : 'auto'}
      />
    </View>
  );
  return (
    <View style={styles.fieldWrap}>
      {label ? (
        <AppText size={11} weight="700" color={colors.text2}>
          {label}
        </AppText>
      ) : null}
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          {field}
        </Pressable>
      ) : (
        field
      )}
      {hint && !error ? (
        <AppText size={10.5} color={colors.text3}>
          {hint}
        </AppText>
      ) : null}
      {error ? (
        <AppText size={11} color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function PasswordInput({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
}) {
  const [hidden, setHidden] = React.useState(true);
  const {i18n} = useTranslation();
  const tx = (text: string) => translateUiString(text, i18n.resolvedLanguage ?? i18n.language);
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={tx('Password')}
          accessibilityLabel={tx('Password')}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.text3}
          secureTextEntry={hidden}
          style={[styles.field, { flex: 1, margin: 0 }]}
          autoComplete="password"
          textContentType="password"
        />
        <Pressable
          onPress={() => setHidden(v => !v)}
          hitSlop={8}
          accessibilityLabel={tx(hidden ? 'Show password' : 'Hide password')}
        >
          <Icon
            name={hidden ? 'eye' : 'micoff'}
            size={16}
            color={colors.text2}
          />
        </Pressable>
      </View>
      {error ? (
        <AppText size={11} color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function PhoneInput({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
}) {
  const {i18n} = useTranslation();
  const tx = (text: string) => translateUiString(text, i18n.resolvedLanguage ?? i18n.language);
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldRow}>
        <AppText weight="800" size={13} color={colors.navy}>
          +91
        </AppText>
        <TextInput
          value={value}
          onChangeText={text =>
            onChangeText(text.replace(/\D/g, '').slice(0, 10))
          }
          placeholder={tx('Phone number')}
          accessibilityLabel={tx('Phone number')}
          placeholderTextColor={colors.text3}
          keyboardType="phone-pad"
          style={[styles.field, { flex: 1, margin: 0 }]}
          autoComplete="tel"
          maxLength={10}
        />
      </View>
      {error ? (
        <AppText size={11} color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = createThemedStyles({
  search: {
    backgroundColor: colors.pressed,
    borderRadius: radius.search,
    paddingVertical: 13,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: insetShadow(),
  },
  searchFocused: {
    boxShadow:
      'inset 4px 4px 10px rgba(148, 163, 184, 0.32), inset -4px -4px 10px rgba(255, 255, 255, 0.9), 0 0 0 2.5px rgba(21, 101, 192, 0.55)',
  },
  searchFlat: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE5EF',
    boxShadow:
      '0 8px 16px -12px rgba(26, 35, 126, 0.28), inset 2px 2px 5px rgba(148, 163, 184, 0.16), inset -2px -2px 5px rgba(255, 255, 255, 0.72)',
  },
  searchFlatFocused: {
    borderColor: '#1976D2',
    boxShadow:
      '0 0 0 2px rgba(25, 118, 210, 0.12), 0 8px 16px -12px rgba(26, 35, 126, 0.28), inset 2px 2px 5px rgba(148, 163, 184, 0.16), inset -2px -2px 5px rgba(255, 255, 255, 0.72)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 28,
    padding: 0,
    fontFamily: fonts.inter,
    fontSize: 12.5,
    color: colors.ink,
  },
  flex: { flex: 1 },
  fieldWrap: { gap: 6 },
  field: {
    minHeight: 48,
    backgroundColor: colors.pressed,
    borderRadius: radius.field,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.inter,
    fontSize: 13,
    color: colors.ink,
    boxShadow: insetShadow(),
  },
  fieldRow: {
    minHeight: 48,
    backgroundColor: colors.pressed,
    borderRadius: radius.field,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: insetShadow(),
  },
  fieldInner: {
    flex: 1,
    minWidth: 0,
    minHeight: 28,
    padding: 0,
    margin: 0,
    fontFamily: fonts.inter,
    fontSize: 13,
    color: colors.ink,
  },
  fieldReadonly: { opacity: 0.92 },
});
