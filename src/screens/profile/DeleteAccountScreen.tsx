import React from 'react';
import {Alert, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRepositories} from '../../core/di';
import {useSessionStore} from '../../core/session';
import {appConfig} from '../../core/config';
import {shareService} from '../../core/services';
import {useAsyncAction} from '../../core/useAsyncAction';
import {AppText, ClayButton, ClayCard} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {colors} from '../../theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../../navigation/types';

export function DeleteAccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const repos = useRepositories();
  const action = useAsyncAction(async () => {
    const result = await repos.account.requestDeletion();
    if (!['requested', 'deleted'].includes(result.status) || !result.requestId) throw new Error('The deletion request was not confirmed. Please try again.');
    await useSessionStore.getState().logout();
    Alert.alert(result.status === 'deleted' ? 'Account deleted' : 'Deletion requested', result.message ?? 'Your request was accepted. See the privacy policy for data retention details.');
  });
  return <Screen padded={false}>
    <DetailHeader title="Delete account" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={{padding: 16, gap: 16}}>
      <ClayCard variant="pink">
        <AppText weight="900" size={20} color={colors.navy}>Your account and learning data</AppText>
        <AppText>Request deletion of your RACI account and its associated personal data. This includes your profile and saved learning activity. You will lose access to this account.</AppText>
        <AppText>Any records that must be retained, and the reasons and retention periods, are explained in our privacy policy. Deleting an account does not automatically request a purchase refund.</AppText>
      </ClayCard>
      <ClayButton label="Read privacy policy" tone="ghost" onPress={() => navigation.navigate('Legal', {slug: 'privacy'})} />
      {appConfig.accountDeletionUrl ? <ClayButton label="Request deletion on our website" tone="ghost" onPress={() => void shareService.openUrl(appConfig.accountDeletionUrl!)} /> : null}
      {action.error ? <AppText accessibilityRole="alert" color={colors.error}>{action.error}</AppText> : null}
      <ClayButton label={action.busy ? 'Sending request…' : 'Request account deletion'} disabled={action.busy}
        onPress={() => Alert.alert('Delete your RACI account?', 'This will request deletion of your account and associated data. Once completed, deletion cannot be undone.', [
          {text: 'Keep account', style: 'cancel'}, {text: 'Request deletion', style: 'destructive', onPress: () => void action.run()},
        ])} />
    </ScrollView>
  </Screen>;
}
