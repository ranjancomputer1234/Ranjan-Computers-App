import React from 'react';
import {Alert, ScrollView, StatusBar, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon, type IconName} from '../../assets/icons';
import {RediLogo} from '../../assets/illustrations';
import {AppText, ClayButton} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {useSessionStore} from '../../core/session';
import {brand, colors, createThemedStyles, gradients, radius} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';

const POINTS: Array<{icon: IconName; title: string; body: string}> = [
  {
    icon: 'shield',
    title: 'Your sign-in stays on this device',
    body: 'The password and saved session are still here.',
  },
  {
    icon: 'book',
    title: 'Nothing in your account was removed',
    body: 'Courses, progress, and purchases stay with you.',
  },
  {
    icon: 'wifi',
    title: 'This is usually a connection pause',
    body: 'Try again once the network or server is reachable.',
  },
];

export function SessionRecoveryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const note = useSessionStore(state => state.recoveryNote);
  const hydrate = useSessionStore(state => state.hydrate);
  const [busy, setBusy] = React.useState<'retry' | 'signOut' | null>(null);

  const retry = async () => {
    if (busy) return;
    setBusy('retry');
    try {
      await hydrate();
    } finally {
      setBusy(current => (current === 'retry' ? null : current));
    }
  };

  const signOut = () => {
    if (busy) return;
    Alert.alert(
      'Sign out of this device?',
      'The saved sign-in will be removed from this phone. You can sign in again afterward.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            setBusy('signOut');
            void useSessionStore.getState().logout().finally(() => {
              setBusy(current => (current === 'signOut' ? null : current));
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.scroll, paddingBottom: Math.max(insets.bottom, 16)}]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.scheme === 'dark' ? '#080F22' : '#0D1B3E'}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingTop: insets.top}]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <Gradient
          colors={gradients.loginHero}
          start={{x: 0.08, y: 0}}
          end={{x: 0.92, y: 1}}
          style={styles.hero}>
          <RediLogo size={64} borderColor="rgba(255,255,255,0.85)" />
          <AppText weight="800" size={18} color="#FFFFFF" center>
            {brand.institute}
          </AppText>
          <AppText weight="600" size={12} color="#FFD54F" center>
            {brand.tagline}
          </AppText>
        </Gradient>

        <View style={styles.sheet}>
          <View style={styles.mark}>
            <View style={styles.markHalo} />
            <Gradient colors={gradients.primaryButton} style={styles.markCore}>
              <Icon name="refresh" size={26} color="#FFFFFF" />
            </Gradient>
          </View>

          <AppText weight="800" size={24} color={colors.navy} center style={styles.title}>
            Reconnect to continue
          </AppText>
          <AppText weight="500" size={15} color={colors.text2} center style={styles.body}>
            We could not restore your account. Your sign-in details are still saved securely.
          </AppText>

          {note ? (
            <View style={styles.note}>
              <Icon name="wifi" size={16} color={colors.primary} />
              <AppText weight="600" size={13} color={colors.navy} style={styles.noteText}>
                {note}
              </AppText>
            </View>
          ) : null}

          <View style={styles.points}>
            {POINTS.map(point => (
              <View key={point.title} style={styles.point}>
                <View style={styles.pointIcon}>
                  <Icon name={point.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.pointCopy}>
                  <AppText weight="700" size={14} color={colors.navy}>
                    {point.title}
                  </AppText>
                  <AppText weight="500" size={12.5} color={colors.text2} style={styles.pointBody}>
                    {point.body}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <ClayButton
          label={busy === 'retry' ? 'Reconnecting…' : 'Try again'}
          icon={busy === 'retry' ? undefined : 'refresh'}
          disabled={busy !== null}
          onPress={() => void retry()}
          style={styles.action}
        />
        <ClayButton
          label={busy === 'signOut' ? 'Signing out…' : 'Sign out'}
          tone="ghost"
          disabled={busy !== null}
          onPress={signOut}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = createThemedStyles({
  screen: {flex: 1},
  scroll: {flexGrow: 1, paddingBottom: 12},
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 28,
    paddingBottom: 56,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  sheet: {
    marginTop: -32,
    marginHorizontal: 16,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 8,
    borderRadius: radius.hero,
    backgroundColor: colors.white,
    gap: 14,
    boxShadow: '0 10px 28px rgba(13, 71, 161, 0.12)',
  },
  mark: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
  },
  markHalo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
  },
  markCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {lineHeight: 30, letterSpacing: -0.3},
  body: {lineHeight: 22},
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.pastel.sky,
  },
  noteText: {flex: 1, lineHeight: 18},
  points: {gap: 14, paddingTop: 2, paddingBottom: 8},
  point: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  pointIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pastel.blue,
  },
  pointCopy: {flex: 1, gap: 2},
  pointBody: {lineHeight: 18},
  actions: {paddingHorizontal: 16, paddingTop: 12, gap: 10},
  action: {width: '100%'},
});
