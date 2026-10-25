import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useTranslation} from 'react-i18next';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {appConfig} from '../../core/config';
import {useRepositories} from '../../core/di';
import {useSessionStore} from '../../core/session';
import {useAsyncAction} from '../../core/useAsyncAction';
import {brand, clay, colors} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {AppText, ClayToggle, SearchInput} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Icon, type IconName} from '../../assets/icons';
import {IconButton} from '../../components/ui/Clay';
import type {ProfileStackParamList} from '../../navigation/types';
import {useSettings} from '../../features/settings/hooks/useSettings';
import {
  hasNativeReminderSupport,
  openReminderSettings,
  permissionAllowsReminders,
  requestReminderPermission,
} from '../../features/settings/reminders';
import {
  APP_LANGUAGES,
  LEARNING_GOALS,
  REMINDER_HOURS,
  VIDEO_QUALITY_OPTIONS,
  formatReminderClock,
  matchesSettingsQuery,
  videoQualitySubtitle,
  type AppLanguage,
  type LearningGoal,
} from '../../features/settings/preferences';
import {styles} from './styles';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;
type Sheet = 'quality' | 'language' | 'reminder' | 'focus' | null;

type RowTone = {
  bg: string;
  icon: string;
};

const TONE = {
  blue: {get bg() { return colors.pastel.blue; }, get icon() { return clay.blue.icon; }},
  yellow: {get bg() { return colors.pastel.yellow; }, get icon() { return clay.yellow.icon; }},
  purple: {get bg() { return colors.pastel.purple; }, get icon() { return clay.purple.icon; }},
  mint: {get bg() { return colors.pastel.mint; }, get icon() { return clay.mint.icon; }},
  orange: {get bg() { return colors.pastel.orange; }, get icon() { return clay.orange.icon; }},
  cyan: {get bg() { return colors.pastel.cyan; }, get icon() { return clay.cyan.icon; }},
  sky: {get bg() { return colors.pastel.sky; }, get icon() { return clay.sky.icon; }},
  indigo: {get bg() { return colors.pastel.indigo; }, get icon() { return clay.indigo.icon; }},
  pink: {get bg() { return colors.pastel.pink; }, get icon() { return clay.pink.icon; }},
  green: {get bg() { return colors.pastel.green; }, get icon() { return clay.green.icon; }},
  lav: {get bg() { return colors.pastel.lavender; }, get icon() { return clay.lavender.icon; }},
  red: {get bg() { return colors.pastel.red; }, get icon() { return clay.red.icon; }},
} as const;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const theme = useTheme();
  const repos = useRepositories();
  const {signedIn, prefs, editSubtitle, paymentSubtitle, qualitySubtitle, reminderSubtitle, languageValue} =
    useSettings();
  const [query, setQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [sheet, setSheet] = React.useState<Sheet>(null);
  const signOut = useAsyncAction(async () => {
    try {
      await repos.auth.logout();
    } finally {
      await useSessionStore.getState().logout();
    }
  });

  const confirmLogout = () =>
    Alert.alert(t('logoutConfirm'), t('logoutBody'), [
      {text: t('cancel'), style: 'cancel'},
      {text: t('signOut'), style: 'destructive', onPress: () => void signOut.run()},
    ]);

  const explainStreakFreeze = () => Alert.alert(t('streakFreeze'), t('streakFreezeBody'));

  const enableReminder = async () => {
    const permission = await requestReminderPermission();
    if (!permissionAllowsReminders(permission)) {
      Alert.alert(t('reminderPermissionTitle'), t('reminderPermissionBody'), [
        {text: t('cancel'), style: 'cancel'},
        {text: t('openSettings'), onPress: () => void openReminderSettings()},
      ]);
      return false;
    }
    return true;
  };

  const onReminderToggle = async (value: boolean) => {
    if (!value) {
      prefs.setReminderEnabled(false);
      return;
    }
    if (!(await enableReminder())) return;
    prefs.setReminderEnabled(true);
    Alert.alert(
      t('reminderSaved'),
      hasNativeReminderSupport() ? t('reminderBody') : t('reminderFallbackBody'),
    );
  };

  const onLanguage = (value: AppLanguage) => {
    prefs.setLanguage(value);
    setSheet(null);
    Alert.alert(t('language'), t('languageNote'));
  };

  const onLearningGoal = (value: LearningGoal) => {
    prefs.setLearningGoal(value);
    setSheet(null);
  };

  const rows = {
    edit: matchesSettingsQuery(query, t('editProfile'), editSubtitle),
    subscription: matchesSettingsQuery(query, t('manageSubscription'), t('freePlan')),
    payments: matchesSettingsQuery(query, t('paymentHistory'), paymentSubtitle),
    wifi: matchesSettingsQuery(query, t('wifiOnly'), t('wifiOnlyHint')),
    quality: matchesSettingsQuery(query, t('videoQuality'), qualitySubtitle),
    reminder: matchesSettingsQuery(query, t('reminder'), reminderSubtitle),
    focus: matchesSettingsQuery(query, t('learningFocus'), t('learningFocusHint')),
    freeze: matchesSettingsQuery(query, t('streakFreeze'), t('streakFreezeHint')),
    language: matchesSettingsQuery(query, t('language'), t('languageHint'), languageValue),
    dark: matchesSettingsQuery(query, t('darkMode'), t('darkModeFollow'), t('darkModeOn')),
    notif: matchesSettingsQuery(query, t('notifications'), t('notificationsHint')),
    help: matchesSettingsQuery(query, t('help'), t('helpHint')),
    about: matchesSettingsQuery(query, t('about'), t('aboutHint')),
    privacy: matchesSettingsQuery(query, t('privacy'), t('privacyHint')),
    logout: matchesSettingsQuery(query, t('logout'), t('login')),
    delete: matchesSettingsQuery(query, t('deleteAccount')),
  };
  const showAccount = signedIn && (rows.edit || rows.subscription || rows.payments);
  const showLearning = rows.wifi || rows.quality || rows.reminder || rows.focus || rows.freeze;
  const showApp = rows.language || rows.dark || rows.notif || rows.help || rows.about || rows.privacy;
  const noResults = Boolean(query.trim()) && !showAccount && !showLearning && !showApp && !rows.logout && !rows.delete;

  return (
    <Screen padded={false}>
      <DetailHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            icon="search"
            onPress={() => {
              setSearching(open => !open);
              if (searching) setQuery('');
            }}
            accessibilityLabel={t('search')}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        {searching ? (
          <View style={styles.searchWrap}>
            <SearchInput
              value={query}
              placeholder={t('searchPlaceholder')}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              autoFocus
            />
          </View>
        ) : null}

        {noResults ? (
          <View style={styles.empty}>
            <AppText weight="800" size={16} color={theme.colors.navy} center>
              {t('noResults')}
            </AppText>
            <AppText size={12} color={theme.colors.text2} center>
              {t('noResultsBody')}
            </AppText>
          </View>
        ) : null}

        {showAccount ? (
          <View>
            <GroupHead>{t('account')}</GroupHead>
            <View style={styles.group}>
              {rows.edit ? (
                <SettingsRow
                  icon="user"
                  tone={TONE.blue}
                  title={t('editProfile')}
                  subtitle={editSubtitle}
                  onPress={() => navigation.navigate('EditProfile')}
                />
              ) : null}
              {rows.subscription ? (
                <SettingsRow
                  icon="crown"
                  tone={TONE.yellow}
                  title={t('manageSubscription')}
                  subtitle={t('freePlan')}
                  onPress={showLearnerUnavailable}
                />
              ) : null}
              {rows.payments ? (
                <SettingsRow
                  icon="rupee"
                  tone={TONE.purple}
                  title={t('paymentHistory')}
                  subtitle={paymentSubtitle}
                  onPress={showLearnerUnavailable}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {showLearning ? (
          <View>
            <GroupHead>{t('learning')}</GroupHead>
            <View style={styles.group}>
              {rows.wifi ? (
                <SettingsRow
                  icon="download"
                  tone={TONE.mint}
                  title={t('wifiOnly')}
                  subtitle={t('wifiOnlyHint')}
                  trailing={
                    <ClayToggle
                      value={prefs.wifiOnly}
                      onValueChange={prefs.setWifiOnly}
                      accessibilityLabel={t('wifiOnly')}
                    />
                  }
                />
              ) : null}
              {rows.quality ? (
                <SettingsRow
                  icon="monitor"
                  tone={TONE.blue}
                  title={t('videoQuality')}
                  subtitle={qualitySubtitle}
                  onPress={() => setSheet('quality')}
                />
              ) : null}
              {rows.reminder ? (
                <SettingsRow
                  icon="bell"
                  tone={TONE.orange}
                  title={t('reminder')}
                  subtitle={reminderSubtitle}
                  onPress={() => setSheet('reminder')}
                  trailing={
                    <ClayToggle
                      value={prefs.reminderEnabled}
                      onValueChange={value => void onReminderToggle(value)}
                      accessibilityLabel={t('reminder')}
                    />
                  }
                />
              ) : null}
              {rows.focus ? (
                <SettingsRow
                  icon="target"
                  tone={TONE.purple}
                  title={t('learningFocus')}
                  subtitle={t('learningFocusHint')}
                  value={LEARNING_GOALS.find(item => item.id === prefs.learningGoal)?.label ?? 'Not selected'}
                  onPress={() => setSheet('focus')}
                />
              ) : null}
              {rows.freeze ? (
                <SettingsRow
                  icon="zap"
                  tone={TONE.cyan}
                  title={t('streakFreeze')}
                  subtitle={t('streakFreezeHint')}
                  onPress={explainStreakFreeze}
                  trailing={
                    <ClayToggle value={false} disabled accessibilityLabel={t('streakFreeze')} />
                  }
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {showApp ? (
          <View>
            <GroupHead>{t('app')}</GroupHead>
            <View style={styles.group}>
              {rows.language ? (
                <SettingsRow
                  icon="globe"
                  tone={TONE.sky}
                  title={t('language')}
                  subtitle={t('languageHint')}
                  value={languageValue}
                  onPress={() => setSheet('language')}
                />
              ) : null}
              {rows.dark ? (
                <SettingsRow
                  icon="moon"
                  tone={TONE.indigo}
                  title={t('darkMode')}
                  subtitle={prefs.darkMode ? t('darkModeOn') : t('darkModeFollow')}
                  trailing={
                    <ClayToggle
                      value={prefs.darkMode}
                      onValueChange={prefs.setDarkMode}
                      accessibilityLabel={t('darkMode')}
                    />
                  }
                />
              ) : null}
              {rows.notif ? (
                <SettingsRow
                  icon="bell"
                  tone={TONE.pink}
                  title={t('notifications')}
                  subtitle={t('notificationsHint')}
                  onPress={() => navigation.navigate('NotificationSettings')}
                />
              ) : null}
              {rows.help ? (
                <SettingsRow
                  icon="help"
                  tone={TONE.green}
                  title={t('help')}
                  subtitle={t('helpHint')}
                  onPress={() => navigation.navigate('HelpSupport')}
                />
              ) : null}
              {rows.about ? (
                <SettingsRow
                  icon="help"
                  tone={TONE.sky}
                  title={t('about')}
                  subtitle={t('aboutHint')}
                  onPress={() => navigation.navigate('About')}
                />
              ) : null}
              {rows.privacy ? (
                <SettingsRow
                  icon="shield"
                  tone={TONE.lav}
                  title={t('privacy')}
                  subtitle={t('privacyHint')}
                  onPress={() => navigation.navigate('Legal', {slug: 'privacy'})}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {rows.logout ? (
          signedIn ? (
            <SettingsRow
              icon="logout"
              tone={TONE.red}
              title={t('logout')}
              subtitle={t('logoutHint')}
              danger
              hideChevron
              onPress={confirmLogout}
            />
          ) : (
            <SettingsRow
              icon="user"
              tone={TONE.blue}
              title={t('login')}
              subtitle={t('loginHint')}
              onPress={() => useSessionStore.getState().showLogin()}
            />
          )
        ) : null}

        {signOut.error ? <AppText color={theme.colors.error}>{signOut.error}</AppText> : null}

        <View style={styles.footerGap}>
          <AppText face="mono" size={9} weight="600" color={theme.colors.text3} center style={styles.version}>
            {t('version', {version: appConfig.versionName, institute: brand.institute})}
          </AppText>
          {signedIn && rows.delete ? (
            <Pressable
              onPress={() => navigation.navigate('DeleteAccount')}
              accessibilityRole="button"
              style={styles.delete}>
              <AppText size={11} weight="700" color={theme.colors.error} center>
                {t('deleteAccount')}
              </AppText>
            </Pressable>
          ) : null}
        </View>

      </ScrollView>

      <OptionSheet
        visible={sheet === 'quality'}
        title={t('pickQuality')}
        onClose={() => setSheet(null)}>
        {VIDEO_QUALITY_OPTIONS.map(option => (
          <ChoiceRow
            key={option}
            label={videoQualitySubtitle(option)}
            selected={prefs.videoQuality === option}
            onPress={() => {
              prefs.setVideoQuality(option);
              setSheet(null);
            }}
          />
        ))}
      </OptionSheet>

      <OptionSheet
        visible={sheet === 'language'}
        title={t('pickLanguage')}
        hint={t('languageNote')}
        onClose={() => setSheet(null)}>
        {APP_LANGUAGES.map(option => (
          <ChoiceRow
            key={option.id}
            label={`${option.native} · ${option.label}`}
            selected={prefs.language === option.id}
            onPress={() => onLanguage(option.id)}
          />
        ))}
      </OptionSheet>

      <OptionSheet
        visible={sheet === 'reminder'}
        title={t('pickTime')}
        hint={t('reminderBody')}
        onClose={() => setSheet(null)}>
        {REMINDER_HOURS.map(hour => (
          <ChoiceRow
            key={hour}
            label={formatReminderClock(hour, 0)}
            selected={prefs.reminderEnabled && prefs.reminderHour === hour && prefs.reminderMinute === 0}
            onPress={() => void (async () => {
              if (!(await enableReminder())) return;
              prefs.setReminderTime(hour, 0);
              setSheet(null);
            })()}
          />
        ))}
      </OptionSheet>

      <OptionSheet
        visible={sheet === 'focus'}
        title={t('pickLearningFocus')}
        hint={t('learningFocusHint')}
        onClose={() => setSheet(null)}>
        {LEARNING_GOALS.map(option => (
          <ChoiceRow
            key={option.id}
            label={option.label}
            selected={prefs.learningGoal === option.id}
            onPress={() => onLearningGoal(option.id)}
          />
        ))}
      </OptionSheet>
    </Screen>
  );
}

function GroupHead({children}: {children: React.ReactNode}) {
  const theme = useTheme();
  return (
    <AppText face="mono" size={10.5} weight="800" color={theme.colors.text2} style={styles.groupHead}>
      {children}
    </AppText>
  );
}

function SettingsRow({
  icon,
  tone,
  title,
  subtitle,
  value,
  onPress,
  trailing,
  danger,
  hideChevron,
}: {
  icon: IconName;
  tone: RowTone;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  hideChevron?: boolean;
}) {
  const theme = useTheme();
  const chevron = Boolean(onPress) && !hideChevron && !trailing && !value;
  const body = (
    <>
      <View style={[styles.mic, {backgroundColor: tone.bg}]}>
        <Icon name={icon} size={17} color={tone.icon} />
      </View>
      <View style={styles.copy}>
        <AppText
          weight="800"
          size={11.5}
          color={danger ? theme.colors.error : theme.colors.navy}
          numberOfLines={1}
          style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size={9} weight="500" color={theme.colors.text2} numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText size={9.5} weight="600" color={theme.colors.text3} style={styles.value}>
          {value}
        </AppText>
      ) : null}
    </>
  );
  return (
    <View style={[styles.row, {backgroundColor: theme.colors.white}]}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({pressed}) => [{flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12}, pressed && styles.rowPressed]}>
          {body}
          {chevron ? <Icon name="chev" size={14} color={theme.colors.text3} /> : null}
        </Pressable>
      ) : (
        <View style={{flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12}}>
          {body}
        </View>
      )}
      {trailing}
    </View>
  );
}

function OptionSheet({
  visible,
  title,
  hint,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  hint?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const {t} = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalSheet, {backgroundColor: theme.colors.white}]} onPress={event => event.stopPropagation()}>
          <AppText weight="900" size={16} color={theme.colors.navy}>
            {title}
          </AppText>
          {hint ? (
            <AppText size={12} color={theme.colors.text2} style={styles.modalHint}>
              {hint}
            </AppText>
          ) : null}
          <ScrollView>{children}</ScrollView>
          <Pressable onPress={onClose} accessibilityRole="button">
            <AppText weight="700" size={13} color={theme.colors.primary} center>
              {t('cancel')}
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChoiceRow({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected}}
      style={[
        styles.modalRow,
        {backgroundColor: selected ? theme.colors.pastel.blue : theme.colors.pressed},
      ]}>
      <AppText weight={selected ? '800' : '600'} size={13} color={theme.colors.navy}>
        {label}
      </AppText>
      {selected ? <Icon name="check" size={16} color={theme.colors.primary} /> : null}
    </Pressable>
  );
}
