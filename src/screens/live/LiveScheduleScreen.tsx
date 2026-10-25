import React from 'react';
import {Alert, Pressable, ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {colors, gradients} from '../../theme';
import {AppText, ClayButton, EmptyState, ErrorState, LoadingBlock} from '../../components/ui';
import {IconButton} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {Icon} from '../../assets/icons';
import type {HomeNav} from '../../navigation/types';
import type {LiveClass} from '../../core/types';
import {useLiveSchedule} from '../../features/live/hooks/useLiveSchedule';
import {openReminderSettings} from '../../features/settings/reminders';
import {styles} from './styles';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

const dayKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const addDays = (value: Date, amount: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
};

const weekOfMonth = (date: Date) => {
  const firstDayOffset = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((date.getDate() + firstDayOffset) / 7);
};

const timeParts = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-IN', {hour: 'numeric', minute: '2-digit', hour12: true})
    .formatToParts(new Date(iso));
  return {
    time: `${parts.find(part => part.type === 'hour')?.value ?? ''}:${parts.find(part => part.type === 'minute')?.value ?? ''}`,
    period: parts.find(part => part.type === 'dayPeriod')?.value?.toUpperCase() ?? '',
  };
};

export function LiveScheduleScreen() {
  const navigation = useNavigation<HomeNav>();
  const {query: schedule, reminder, enableAll, upcomingCount, allRemindersEnabled} = useLiveSchedule();
  const pullRefresh = usePullRefreshFeedback({
    refreshing: schedule.isRefetching,
    onRefresh: () => {
      schedule.refetch().catch(() => undefined);
    },
  });
  const [selected, setSelected] = React.useState<string | null>(null);
  const featuredDate = React.useMemo(() => {
    const featured = schedule.data?.find(item => item.status === 'live') ?? schedule.data?.[0];
    return featured ? new Date(featured.startsAt) : new Date();
  }, [schedule.data]);
  const selectedDate = React.useMemo(() => {
    if (!selected) return featuredDate;
    const found = Array.from({length: 5}, (_, index) => addDays(featuredDate, index - 2))
      .find(date => dayKey(date) === selected);
    return found ?? featuredDate;
  }, [featuredDate, selected]);
  const days = React.useMemo(
    () => Array.from({length: 5}, (_, index) => addDays(featuredDate, index - 2)),
    [featuredDate],
  );
  const activeKey = selected ?? dayKey(featuredDate);
  const classes = schedule.data?.filter(item => dayKey(item.startsAt) === activeKey) ?? [];
  const liveCount = classes.filter(item => ['live', 'starting', 'reconnecting'].includes(item.status)).length;
  const isToday = dayKey(selectedDate) === dayKey(new Date());
  const headerSubtitle = `${selectedDate.toLocaleDateString('en-IN', {month: 'long', year: 'numeric'})} · Week ${weekOfMonth(selectedDate)}`;
  const showReminderError = (error: Error) => {
    if (error.message === 'notification_permission_denied') {
      Alert.alert(
        'Allow notifications',
        'Turn on notifications in device settings so RACI can remind you before class.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open settings', onPress: () => void openReminderSettings()},
        ],
      );
      return;
    }
    if (error.message === 'class_not_upcoming') {
      Alert.alert('Class already started', 'Reminders can only be set for upcoming classes.');
      return;
    }
    Alert.alert('Reminder not set', 'RACI could not schedule this reminder. Please try again.');
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Live Classes"
        subtitle={headerSubtitle}
        onCalendar={() => setSelected(dayKey(featuredDate))}
        onNotifications={showLearnerUnavailable}
        unread
      />
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.dayChips}>
          {days.map(date => {
            const active = dayKey(date) === activeKey;
            return (
              <Pressable
                key={dayKey(date)}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                accessibilityLabel={date.toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric'})}
                onPress={() => setSelected(dayKey(date))}
                style={[styles.dayChip, active && styles.dayChipOn]}>
                <AppText weight="600" size={8} color={active ? 'rgba(255,255,255,0.85)' : colors.text3} style={{letterSpacing: 0.8}}>
                  {date.toLocaleDateString('en-IN', {weekday: 'short'}).toUpperCase()}
                </AppText>
                <AppText weight="800" size={10} color={active ? '#fff' : colors.text2}>{date.getDate()}</AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.dateStrip}>
          <Icon name="live" size={17} color="#C62828" />
          <AppText weight="800" size={11} color={colors.navy} style={{flex: 1}}>
            {isToday ? 'Today' : selectedDate.toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'short'})} — {classes.length} {classes.length === 1 ? 'class' : 'classes'}
          </AppText>
          {liveCount ? (
            <View style={styles.liveTypeChip}>
              <AppText weight="800" size={8} color="#C62828">{liveCount} LIVE NOW</AppText>
            </View>
          ) : null}
        </View>

        {schedule.isLoading ? <LoadingBlock /> : null}
        {schedule.isError ? <ErrorState message="Schedule unavailable." onRetry={() => schedule.refetch()} /> : null}
        {!schedule.isLoading && !schedule.isError && !classes.length ? (
          <EmptyState title="No classes scheduled" body="Choose another day to see upcoming and recorded sessions." />
        ) : null}
        {classes.map(item => (
          <ClassRow
            key={item.id}
            item={item}
            reminderBusy={reminder.isPending && reminder.variables?.id === item.id}
            onOpen={showLearnerUnavailable}
            onReminder={() => reminder.mutate(
              {id: item.id, enabled: !item.reminderSet},
              {onError: showReminderError},
            )}
          />
        ))}

        <Gradient colors={['#4A148C', '#6A1B9A', '#8E24AA']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.reminderBanner}>
          <View style={styles.reminderCopy}>
            <Gradient colors={gradients.orangeCta} style={styles.reminderPill}>
              <AppText weight="800" size={8.5} color="#fff" style={{letterSpacing: 1}}>SET REMINDER</AppText>
            </Gradient>
            <AppText weight="900" size={15} color="#fff">Never miss a class</AppText>
            <AppText weight="600" size={10} color="rgba(255,255,255,0.82)" style={{lineHeight: 15}}>
              {allRemindersEnabled
                ? `All ${upcomingCount} upcoming ${upcomingCount === 1 ? 'class' : 'classes'} covered`
                : upcomingCount > 0
                  ? 'Get notified 15 min before every live session'
                  : 'New class reminders will appear here'}
            </AppText>
            <ClayButton
              label={enableAll.isPending
                ? 'Enabling…'
                : allRemindersEnabled
                  ? 'Reminders Enabled'
                  : upcomingCount === 0
                    ? 'No Upcoming Classes'
                    : 'Enable Reminders'}
              tone="orange"
              compact
              disabled={enableAll.isPending || allRemindersEnabled || upcomingCount === 0}
              onPress={() => enableAll.mutate(undefined, {onError: showReminderError})}
            />
          </View>
          <View style={styles.reminderArt}><Icon name="bell" size={76} color="rgba(255,255,255,0.85)" /></View>
        </Gradient>
        {enableAll.isSuccess && enableAll.data.ids.length > 0 ? (
          <AppText color="#2E7D32" size={11} weight="700">
            {enableAll.data.ids.length} {enableAll.data.ids.length === 1 ? 'reminder' : 'reminders'} enabled successfully.
          </AppText>
        ) : null}
        {reminder.isError || enableAll.isError ? (
          <AppText color={colors.error} size={11}>
            {[reminder.error, enableAll.error].some(error => error?.message === 'notification_permission_denied')
              ? 'Allow notifications in device settings to use reminders.'
              : 'Reminder could not be updated. Please retry.'}
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ClassRow({
  item,
  onOpen,
  onReminder,
  reminderBusy,
}: {
  item: LiveClass;
  onOpen: () => void;
  onReminder: () => void;
  reminderBusy: boolean;
}) {
  const {time, period} = timeParts(item.startsAt);
  const isLive = ['live', 'starting', 'reconnecting'].includes(item.status);
  const ended = item.status === 'ended';
  const duration = item.durationLabel?.replace(' min', 'm') ?? `${Math.max(1, Math.round((new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60000))}m`;
  return (
    <View style={[styles.classRow, isLive && styles.classRowLive, ended && {opacity: 0.85}]}>
      <View style={styles.classTime}>
        <AppText weight="800" size={13} color={colors.navy}>{time}</AppText>
        <AppText weight="600" size={8.5} color={colors.text2}>{period} · {ended ? 'ended' : duration}</AppText>
      </View>
      <View style={styles.classBody}>
        <View style={styles.classTitleRow}>
          {isLive ? <View style={styles.livePill}><View style={styles.liveDot} /><AppText weight="800" size={8} color="#fff" style={{letterSpacing: 1}}>LIVE</AppText></View> : null}
          <AppText weight="800" size={11.5} color={colors.navy} numberOfLines={2} style={{flex: 1}}>{item.title}</AppText>
        </View>
        <AppText weight="500" size={9.5} color={colors.text2} numberOfLines={2}>
          {ended && item.recordingAvailable ? 'Recording ready' : item.instructorName}{isLive && item.viewerCount ? ` · ${item.viewerCount.toLocaleString('en-IN')} watching` : item.batch ? ` · ${item.batch}` : ''}
        </AppText>
      </View>
      {isLive ? <ClayButton label="Join Now" tone="orange" compact onPress={onOpen} /> : null}
      {ended && item.recordingAvailable ? <ClayButton label="Watch" tone="ghost" compact onPress={onOpen} /> : null}
      {item.status === 'scheduled' ? (
        <IconButton
          icon="bell"
          color={item.reminderSet ? colors.primary : colors.navy}
          dot={item.reminderSet}
          onPress={reminderBusy ? undefined : onReminder}
          accessibilityLabel={item.reminderSet ? 'Turn off reminder' : 'Set reminder'}
        />
      ) : null}
    </View>
  );
}
