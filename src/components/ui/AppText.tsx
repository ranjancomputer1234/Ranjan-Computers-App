import React from 'react';
import {Text, type StyleProp, type TextProps, type TextStyle} from 'react-native';
import {useTranslation} from 'react-i18next';
import {fonts} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {translateUiNode} from '../../features/settings/uiTranslations';

type Weight = '400' | '500' | '600' | '700' | '800' | '900';
type Face = 'inter' | 'caveat' | 'mono';

type Props = TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  face?: Face;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  /** Keep repository-authored content in its published language. */
  translate?: boolean;
};

export function AppText({
  weight = '400',
  size = 14,
  color,
  face = 'inter',
  center,
  style,
  children,
  translate = true,
  ...rest
}: Props) {
  const theme = useTheme();
  const {i18n} = useTranslation();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: face === 'caveat' ? fonts.caveat : face === 'mono' ? fonts.mono : fonts.inter,
          fontWeight: weight,
          fontSize: size,
          color: color ?? theme.colors.ink,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}>
      {translate ? translateUiNode(children, i18n.resolvedLanguage ?? i18n.language) : children}
    </Text>
  );
}
