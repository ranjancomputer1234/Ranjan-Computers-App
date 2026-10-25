import React from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useTranslation} from 'react-i18next';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {appConfig} from '../../core/config';
import {AppText, ClayButton, ClayToggle} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Icon, type IconName} from '../../assets/icons';
import {useTheme} from '../../theme/ThemeProvider';
import {clay} from '../../theme';
import {usePreferencesStore} from '../../features/settings/preferencesStore';
import {
  getReminderPermission,
  openReminderSettings,
  requestReminderPermission,
  type ReminderPermission,
} from '../../features/settings/reminders';
import type {ProfileStackParamList} from '../../navigation/types';
import {styles} from './styles';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

export function NotificationSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const theme = useTheme();
  const prefs = usePreferencesStore();
  const [permission, setPermission] = React.useState<ReminderPermission>('not_determined');

  React.useEffect(() => {
    void getReminderPermission().then(setPermission);
  }, []);

  const enableDeviceAlerts = async () => {
    const result = await requestReminderPermission();
    setPermission(result);
    if (result === 'denied') {
      Alert.alert(t('reminderPermissionTitle'), t('reminderPermissionBody'), [
        {text: t('cancel'), style: 'cancel'},
        {text: t('openSettings'), onPress: () => void openReminderSettings()},
      ]);
    }
  };

  return (
    <Screen padded={false}>
      <DetailHeader title={t('notifications')} subtitle={t('notificationsHint')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.bannerCard, {backgroundColor: theme.colors.pastel.blue}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <View style={[styles.mic, {backgroundColor: theme.colors.white}]}>
              <Icon name="bell" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.copy}>
              <AppText weight="800" size={12} color={theme.colors.navy}>{t('deviceAlerts')}</AppText>
              <AppText size={10} color={theme.colors.text2}>
                {appConfig.pushProvider === 'none'
                  ? t('deviceAlertsSetup')
                  : permission === 'authorized' ? t('deviceAlertsOn') : t('deviceAlertsOff')}
              </AppText>
            </View>
            {appConfig.pushProvider !== 'none' && permission !== 'authorized' ? (
              <ClayButton compact label={t('enableAlerts')} onPress={() => void enableDeviceAlerts()} />
            ) : null}
          </View>
        </View>
        <AppText style={styles.groupHead} size={9.5} weight="800" color={theme.colors.text3}>ALERT TYPES</AppText>
        <View style={styles.group}>
          <PrefRow
            icon="live"
            bg={theme.colors.pastel.blue}
            color={clay.blue.icon}
            title={t('notifClasses')}
            subtitle={t('notifClassesHint')}
            value={prefs.notifClasses}
            onValueChange={prefs.setNotifClasses}
          />
          <PrefRow
            icon="clipboard"
            bg={theme.colors.pastel.purple}
            color={clay.purple.icon}
            title={t('notifTests')}
            subtitle={t('notifTestsHint')}
            value={prefs.notifTests}
            onValueChange={prefs.setNotifTests}
          />
          <PrefRow
            icon="news"
            bg={theme.colors.pastel.green}
            color={theme.colors.success}
            title={t('notifNews')}
            subtitle={t('notifNewsHint')}
            value={prefs.notifNews}
            onValueChange={prefs.setNotifNews}
          />
          <PrefRow
            icon="gift"
            bg={theme.colors.pastel.orange}
            color={clay.orange.icon}
            title={t('notifOffers')}
            subtitle={t('notifOffersHint')}
            value={prefs.notifOffers}
            onValueChange={prefs.setNotifOffers}
          />
          <View style={[styles.row, {backgroundColor: theme.colors.white}]}>
            <View style={[styles.mic, {backgroundColor: theme.colors.pastel.red}]}>
              <Icon name="bell" size={17} color={theme.colors.error} />
            </View>
            <View style={styles.copy}>
              <AppText weight="800" size={11.5} color={theme.colors.navy}>{t('accountAlerts')}</AppText>
              <AppText size={9} weight="500" color={theme.colors.text2}>{t('accountAlertsHint')}</AppText>
            </View>
            <AppText size={9.5} weight="800" color={theme.colors.success}>ON</AppText>
          </View>
        </View>
        <AppText style={styles.groupHead} size={9.5} weight="800" color={theme.colors.text3}>IN-APP INBOX</AppText>
        <View style={styles.group}>
          <Pressable
            accessibilityRole="button"
            onPress={showLearnerUnavailable}
            style={({pressed}) => [styles.row, {backgroundColor: theme.colors.white}, pressed && styles.rowPressed]}>
            <View style={[styles.mic, {backgroundColor: theme.colors.pastel.red}]}>
              <Icon name="bell" size={17} color={theme.colors.error} />
            </View>
            <View style={styles.copy}>
              <AppText weight="800" size={11.5} color={theme.colors.navy}>
                {t('openInbox')}
              </AppText>
              <AppText size={9} weight="500" color={theme.colors.text2}>
                {t('openInboxHint')}
              </AppText>
            </View>
            <Icon name="chev" size={14} color={theme.colors.text3} />
          </Pressable>
        </View>
        {appConfig.pushProvider === 'none' ? (
          <AppText size={12} color={theme.colors.text2} style={styles.modalHint}>
            Remote alerts need android/app/google-services.json. Admin messages remain available in the in-app inbox; learning and live-class reminders still use local device notifications.
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function PrefRow({
  icon,
  bg,
  color,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: IconName;
  bg: string;
  color: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, {backgroundColor: theme.colors.white}]}>
      <View style={[styles.mic, {backgroundColor: bg}]}>
        <Icon name={icon} size={17} color={color} />
      </View>
      <View style={styles.copy}>
        <AppText weight="800" size={11.5} color={theme.colors.navy}>
          {title}
        </AppText>
        <AppText size={9} weight="500" color={theme.colors.text2}>
          {subtitle}
        </AppText>
      </View>
      <ClayToggle value={value} onValueChange={onValueChange} accessibilityLabel={title} />
    </View>
  );
}
