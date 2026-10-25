import React from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {AppText, ClayButton} from '../../components/ui';
import {ClayCard, ClayIconTile} from '../../components/ui/Clay';
import {appConfig} from '../../core/config';
import type {ProfileStackParamList} from '../../navigation/types';
import {brand, colors} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {styles} from './styles';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

export function AboutScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useTheme();

  return (
    <Screen padded={false}>
      <DetailHeader title={`About ${brand.name}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.page}>
        <ClayCard variant="sky" style={{alignItems: 'center', gap: 10}}>
          <ClayIconTile icon="gradcap" color={colors.primary} size={56} />
          <AppText weight="900" size={21} color={theme.colors.navy} center>{brand.institute}</AppText>
          <AppText weight="700" size={12} color={theme.colors.primary} center>{brand.tagline}</AppText>
        </ClayCard>

        <ClayCard variant="white">
          <AppText weight="900" size={15} color={theme.colors.navy}>Learning with RACI</AppText>
          <AppText size={12.5} color={theme.colors.text2}>
            RACI brings courses, exam practice, current affairs, general awareness, interview preparation, and live learning into one learner app.
          </AppText>
          <View style={{gap: 4}}>
            <AppText face="mono" size={10} color={theme.colors.text3}>APP VERSION</AppText>
            <AppText weight="800" size={13}>{appConfig.versionName}</AppText>
          </View>
        </ClayCard>

        <ClayButton label="Help & Support" tone="ghost" onPress={() => navigation.navigate('HelpSupport')} />
        <ClayButton label="Privacy Policy" tone="ghost" onPress={() => navigation.navigate('Legal', {slug: 'privacy'})} />
        <ClayButton label="Terms of Use" tone="ghost" onPress={() => navigation.navigate('Legal', {slug: 'terms'})} />
      </ScrollView>
    </Screen>
  );
}
