import React from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AppText} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Icon} from '../../assets/icons';
import {colors} from '../../theme';
import {styles} from './styles';

export function SubscriptionScreen() {
  const navigation = useNavigation();
  return (
    <Screen padded={false}>
      <DetailHeader title="Manage Subscription" subtitle="Current plan" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.page}>
        <ClayCard variant="yellow">
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.pastel.yellow,
              }}>
              <Icon name="crown" size={17} color="#F57C00" />
            </View>
            <View style={{flex: 1}}>
              <AppText weight="800" size={13.5} color={colors.navy}>
                Free plan
              </AppText>
              <AppText size={11} color={colors.text2}>
                One-time course and test purchases. No recurring billing is active.
              </AppText>
            </View>
          </View>
        </ClayCard>
        <ClayCard variant="white">
          <AppText weight="800">Upgrade is not a live product</AppText>
          <AppText size={12} color={colors.text2}>
            RACI only shows a paid subscription when the backend confirms an active billing contract. Restore and manage routes will appear then.
          </AppText>
        </ClayCard>
      </ScrollView>
    </Screen>
  );
}
