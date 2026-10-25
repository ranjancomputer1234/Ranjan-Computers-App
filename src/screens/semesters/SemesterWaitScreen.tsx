import React from 'react';
import {Animated, Pressable, ScrollView, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {Icon, type IconName} from '../../assets/icons';
import {useSemesterWait, type WaitChecklistItem, type WaitHeroTone, type WaitRowState} from '../../features/semesters/hooks/useSemesterWait';
import {styles} from './styles';

export function SemesterWaitScreen() {
  const wait = useSemesterWait();
  const pullRefresh = usePullRefreshFeedback({
    refreshing: wait.refreshing,
    onRefresh: wait.refresh,
  });
  const subtitle = [wait.courseTitle, wait.semester ? `Semester ${wait.semester.index}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Semester Verification"
        subtitle={subtitle || 'Awaiting unlock'}
        onBack={() => wait.navigation.goBack()}
        onNotifications={wait.openNotifications}
        unread={wait.unread}
      />
      {wait.detail.isLoading ? <LoadingBlock /> : null}
      {wait.detail.isError ? (
        <ErrorState message="We could not check your semester status." onRetry={() => void wait.refresh()} />
      ) : null}
      {wait.semester ? (
        <ScrollView
          {...pullRefresh.scrollProps}
          contentContainerStyle={styles.page}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <HeroRing tone={wait.hero.tone} icon={wait.hero.icon} pulse={wait.pending} />
            <AppText weight="900" size={20} color={colors.navy} center style={styles.heroTitle}>
              {wait.hero.title}
            </AppText>
            <AppText weight="600" size={11} color={colors.text2} style={styles.heroSub}>
              {wait.hero.subtitle}
            </AppText>
          </View>

          <View style={styles.checklist}>
            <View style={styles.checklistHead}>
              <AppText weight="800" size={16.5} color={colors.navy} style={styles.checklistTitle}>
                Unlock Checklist
              </AppText>
              <AppText weight="700" size={9} color={colors.text2} face="mono" style={styles.stepLabel}>
                STEP {wait.step} OF {wait.stepTotal}
              </AppText>
            </View>
            <View style={styles.checklistRows}>
              {wait.checklist.map(item => (
                <WaitRow
                  key={item.id}
                  item={item}
                  onPress={
                    item.id === 'lessons'
                      ? () => wait.openContent()
                      : item.id === 'test'
                        ? wait.openTest
                        : item.id === 'project'
                          ? wait.openProject
                          : () => void wait.refresh()
                  }
                />
              ))}
            </View>
            <AppText weight="500" size={9.5} color={colors.text2} style={styles.footnote}>
              RACI admin verifies semester completions within 24–48 hrs — after verification{' '}
              {wait.nextSemester ? `Semester ${wait.nextSemester.index}` : 'the next semester'} unlocks automatically.
              {wait.lastChecked ? ` Last checked ${wait.lastChecked}.` : ''}
            </AppText>
          </View>

          {wait.nextSemester ? (
            <Pressable
              accessibilityRole={wait.nextUnlocked ? 'button' : 'summary'}
              onPress={wait.nextUnlocked ? wait.openNext : undefined}
              style={({pressed}) => [styles.semCard, wait.nextUnlocked && pressed && styles.pressed]}>
              <View style={[styles.semNum, wait.nextUnlocked ? styles.semNumReady : styles.semNumLock]}>
                <Icon name={wait.nextUnlocked ? 'check' : 'lock'} size={19} color={wait.nextUnlocked ? '#2E7D32' : '#90A4AE'} />
              </View>
              <View style={styles.semBody}>
                <View style={styles.semTitleRow}>
                  <AppText
                    weight="800"
                    size={12.5}
                    color={wait.nextUnlocked ? colors.navy : '#78909C'}
                    numberOfLines={1}
                    style={styles.semTitle}>
                    Semester {wait.nextSemester.index} · {wait.nextSemester.title}
                  </AppText>
                  <StatChip
                    label={wait.nextUnlocked ? 'READY' : 'WAITING'}
                    tone={wait.nextUnlocked ? 'ok' : 'pend'}
                  />
                </View>
                {wait.nextMeta ? (
                  <AppText weight="500" size={9} color={colors.text2}>
                    {wait.nextMeta}
                  </AppText>
                ) : null}
                <View style={styles.unlockRow}>
                  <Icon name="verify" size={11} color="#90A4AE" />
                  <AppText weight="600" size={8.5} color="#90A4AE" style={{flex: 1, lineHeight: 11}}>
                    {wait.nextUnlocked
                      ? 'Verified — tap to open this semester'
                      : wait.nextSemester.unlockReason ?? 'Unlocks after admin verification — no action needed'}
                  </AppText>
                </View>
              </View>
            </Pressable>
          ) : null}

          {wait.ready ? (
            <ClayButton
              label={wait.review.busy ? 'Submitting…' : 'Submit for review'}
              disabled={wait.review.busy}
              onPress={() => void wait.review.run()}
            />
          ) : null}
          {wait.review.error ? (
            <AppText color={colors.error} size={11}>
              {wait.review.error}
            </AppText>
          ) : null}

          {wait.changes ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => wait.openContent()}
              style={({pressed}) => [styles.waitStrip, styles.waitStripRed, pressed && styles.pressed]}>
              <Icon name="edit" size={18} color="#C62828" />
              <AppText weight="800" size={11} color="#C62828" style={styles.waitStripText}>
                Fix the requested changes, then resubmit this semester
              </AppText>
            </Pressable>
          ) : wait.approved && wait.nextUnlocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={wait.openNext}
              style={({pressed}) => [styles.waitStrip, styles.waitStripGreen, pressed && styles.pressed]}>
              <Icon name="check" size={18} color="#2E7D32" />
              <AppText weight="800" size={11} color="#2E7D32" style={styles.waitStripText}>
                Semester {wait.nextSemester?.index} is ready — tap to start
              </AppText>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{selected: wait.notify}}
              onPress={() => void wait.setNotify(!wait.notify)}
              style={({pressed}) => [styles.waitStrip, pressed && styles.pressed]}>
              <Icon name="bell" size={18} color="#E65100" />
              <AppText weight="800" size={11} color="#E65100" style={styles.waitStripText}>
                {wait.notify
                  ? `We'll notify you the moment Semester ${wait.nextSemester?.index ?? wait.semester.index + 1} unlocks`
                  : `Tap to get notified when Semester ${wait.nextSemester?.index ?? wait.semester.index + 1} unlocks`}
              </AppText>
            </Pressable>
          )}

          <Gradient colors={gradients.semesterWait} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.banner}>
            <View style={styles.bannerCopy}>
              <Gradient colors={['#FFD54F', '#FFA000']} style={styles.bannerPill}>
                <AppText weight="800" size={8.5} color="#fff" style={{letterSpacing: 1.2}}>
                  WHILE YOU WAIT
                </AppText>
              </Gradient>
              <AppText weight="900" size={15} color="#fff">
                Attend Live Classes
              </AppText>
              <AppText weight="600" size={10} color="rgba(255,255,255,0.85)" style={{lineHeight: 14}}>
                {wait.liveLine}
              </AppText>
              <ClayButton
                label={wait.liveClass && ['live', 'starting', 'reconnecting'].includes(wait.liveClass.status) ? 'Join Live Class' : 'View Live Schedule'}
                tone="orange"
                compact
                onPress={wait.openLive}
              />
            </View>
            <View style={styles.bannerArt}>
              <Icon name="live" size={76} color="rgba(255,255,255,0.85)" />
            </View>
          </Gradient>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function HeroRing({tone, icon, pulse}: {tone: WaitHeroTone; icon: IconName; pulse?: boolean}) {
  const ring = {
    amber: {colors: [colors.pastel.yellow, colors.pastel.orange], icon: colors.orange, style: styles.ringAmber},
    green: {colors: [colors.pastel.green, colors.pastel.mint], icon: colors.success, style: styles.ringGreen},
    red: {colors: [colors.pastel.red, colors.pastel.pink], icon: colors.error, style: styles.ringRed},
    blue: {colors: [colors.pastel.blue, colors.pastel.cyan], icon: colors.primary, style: styles.ringBlue},
  } satisfies Record<WaitHeroTone, {colors: string[]; icon: string; style: object}>;
  const look = ring[tone];
  const opacity = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (!pulse) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 0.45, duration: 800, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 1, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, pulse]);
  return (
    <View style={[styles.ring, look.style]}>
      <Gradient colors={look.colors} start={{x: 0.32, y: 0.28}} end={{x: 1, y: 1}} style={styles.ringFill}>
        <Animated.View style={{opacity}}>
          <Icon name={icon} size={38} color={look.icon} />
        </Animated.View>
      </Gradient>
    </View>
  );
}

function WaitRow({item, onPress}: {item: WaitChecklistItem; onPress: () => void}) {
  const rowIcons: Record<WaitRowState, {icon: IconName; color: string; tile: object}> = {
    ok: {icon: 'check', color: colors.success, tile: styles.wicoOk},
    pend: {icon: 'hourglass', color: colors.orange, tile: styles.wicoPend},
    todo: {icon: 'clipboard', color: colors.primary, tile: styles.wicoTodo},
    fail: {icon: 'edit', color: colors.error, tile: styles.wicoFail},
  };
  const look = rowIcons[item.state];
  const titleColor = item.state === 'pend' ? colors.orange : item.state === 'fail' ? colors.error : colors.navy;
  const valueColor = item.state === 'ok' ? colors.success : item.state === 'fail' ? colors.error : colors.text2;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => [styles.waitRow, pressed && styles.pressed]}>
      <View style={[styles.wico, look.tile]}>
        <PulseWrap active={item.state === 'pend'}>
          <Icon name={look.icon} size={17} color={look.color} />
        </PulseWrap>
      </View>
      <View style={styles.waitBody}>
        <AppText weight="800" size={11} color={titleColor} numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText weight="500" size={8.5} color={colors.text2} numberOfLines={2}>
          {item.detail}
        </AppText>
      </View>
      {item.chip ? (
        <StatChip
          label={item.chip}
          tone={item.state === 'ok' ? 'ok' : item.state === 'fail' ? 'fail' : 'pend'}
        />
      ) : item.value ? (
        <AppText weight="800" size={10} color={valueColor} style={styles.waitValue}>
          {item.value}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function StatChip({label, tone}: {label: string; tone: 'pend' | 'ok' | 'fail' | 'lock'}) {
  const color = tone === 'ok' ? colors.success : tone === 'fail' ? colors.error : tone === 'lock' ? colors.text3 : colors.orange;
  const bg = tone === 'ok' ? styles.chipOk : tone === 'fail' ? styles.chipFail : tone === 'lock' ? styles.chipLock : styles.chipPend;
  return (
    <View style={[styles.chip, bg]}>
      <AppText weight="800" size={7.5} color={color} style={styles.chipText}>
        {label}
      </AppText>
    </View>
  );
}

function PulseWrap({active, children}: {active: boolean; children: React.ReactNode}) {
  const opacity = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (!active) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 0.45, duration: 800, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 1, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, opacity]);
  return <Animated.View style={{opacity}}>{children}</Animated.View>;
}
