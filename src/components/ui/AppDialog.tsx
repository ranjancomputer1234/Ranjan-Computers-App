import React from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type AlertButton,
  type AlertOptions,
} from 'react-native';
import {Icon, type IconName} from '../../assets/icons';
import {clay, gradients} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';
import {AppText} from './AppText';
import {Gradient} from './Gradient';

type DialogRequest = {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
};

type DialogTone = 'info' | 'success' | 'warning' | 'danger';

let nextDialogId = 1;
let originalAlert: typeof Alert.alert | undefined;
let alertUsers = 0;
const dialogQueue: DialogRequest[] = [];
const listeners = new Set<() => void>();

function emitDialogChange() {
  listeners.forEach(listener => listener());
}

function subscribeToDialogs(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function currentDialog(): DialogRequest | null {
  return dialogQueue[0] ?? null;
}

function enqueueDialog(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) {
  dialogQueue.push({
    id: nextDialogId++,
    title,
    message,
    buttons: buttons?.length ? buttons : [{text: 'OK'}],
    options,
  });
  emitDialogChange();
}

function completeDialog(id: number, button?: AlertButton, dismissed = false) {
  const active = dialogQueue[0];
  if (!active || active.id !== id) return;
  dialogQueue.shift();
  emitDialogChange();

  if (dismissed) active.options?.onDismiss?.();
  button?.onPress?.();
}

/** Routes React Native alerts through RACI's themed, accessible dialog host. */
function installAppDialogs() {
  alertUsers += 1;
  if (!originalAlert) {
    originalAlert = Alert.alert;
    Alert.alert = enqueueDialog;
  }

  return () => {
    alertUsers -= 1;
    if (alertUsers <= 0 && originalAlert) {
      Alert.alert = originalAlert;
      originalAlert = undefined;
      alertUsers = 0;
      dialogQueue.splice(0, dialogQueue.length);
      emitDialogChange();
    }
  };
}

function dialogTone(dialog: DialogRequest): DialogTone {
  if (dialog.buttons.some(button => button.style === 'destructive')) return 'danger';

  const title = dialog.title.toLowerCase();
  if (/saved|success|complete|verified|account deleted|deletion requested/.test(title)) return 'success';
  if (/could|couldn|unable|unavailable|failed|locked|not set|cancelled|error/.test(title)) return 'warning';
  return 'info';
}

function dialogIcon(dialog: DialogRequest, tone: DialogTone): IconName {
  const title = dialog.title.toLowerCase();
  if (/sign out|logout/.test(title)) return 'logout';
  if (/language/.test(title)) return 'globe';
  if (/reminder|notification|alert/.test(title)) return 'bell';
  if (/delete|remove|discard/.test(title)) return 'shield';
  if (/lock/.test(title)) return 'lock';
  if (tone === 'success') return 'check';
  return 'help';
}

function tonePalette(tone: DialogTone) {
  if (tone === 'danger') return {surface: clay.red.bg, accent: clay.red.icon};
  if (tone === 'success') return {surface: clay.green.bg, accent: clay.green.icon};
  if (tone === 'warning') return {surface: clay.orange.bg, accent: clay.orange.icon};
  return {surface: clay.blue.bg, accent: clay.blue.icon};
}

export function AppDialogHost() {
  const theme = useTheme();
  const [dialog, setDialog] = React.useState<DialogRequest | null>(() => currentDialog());
  const [closing, setClosing] = React.useState(false);
  const backdrop = React.useRef(new Animated.Value(0)).current;
  const card = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const update = () => setDialog(currentDialog());
    const unsubscribe = subscribeToDialogs(update);
    const uninstall = installAppDialogs();
    update();
    return () => {
      unsubscribe();
      uninstall();
    };
  }, []);

  React.useEffect(() => {
    if (!dialog) return;
    setClosing(false);
    backdrop.setValue(0);
    card.setValue(0);
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(card, {
        toValue: 1,
        damping: 18,
        stiffness: 220,
        mass: 0.75,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdrop, card, dialog]);

  const close = React.useCallback(
    (button?: AlertButton, dismissed = false) => {
      if (!dialog || closing) return;
      setClosing(true);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 130,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(card, {
          toValue: 0,
          duration: 130,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => completeDialog(dialog.id, button, dismissed));
    },
    [backdrop, card, closing, dialog],
  );

  if (!dialog) return null;

  const tone = dialogTone(dialog);
  const palette = tonePalette(tone);
  const stacked = dialog.buttons.length > 2;
  const canDismiss = dialog.options?.cancelable === true;
  const cardScale = card.interpolate({inputRange: [0, 1], outputRange: [0.94, 1]});
  const cardTranslate = card.interpolate({inputRange: [0, 1], outputRange: [18, 0]});

  const dismissWithoutAction = () => {
    if (canDismiss) close(undefined, true);
  };

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismissWithoutAction}>
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.absoluteFill,
            styles.backdrop,
            {opacity: backdrop},
          ]}>
          <Pressable
            accessibilityRole={canDismiss ? 'button' : undefined}
            accessibilityLabel={canDismiss ? 'Dismiss dialog' : undefined}
            onPress={dismissWithoutAction}
            style={styles.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          onAccessibilityEscape={dismissWithoutAction}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(25,118,210,0.10)',
              opacity: card,
              transform: [{translateY: cardTranslate}, {scale: cardScale}],
            },
          ]}>
          <View style={[styles.accentBar, {backgroundColor: palette.accent}]} />

          <View style={styles.content}>
            <View style={[styles.iconWrap, {backgroundColor: palette.surface}]}>
              <Icon name={dialogIcon(dialog, tone)} size={24} color={palette.accent} strokeWidth={2.2} />
            </View>

            <View style={styles.copy}>
              <AppText size={20} weight="900" color={theme.colors.navy} center>
                {dialog.title}
              </AppText>
              {dialog.message ? (
                <ScrollView
                  style={styles.messageScroll}
                  contentContainerStyle={styles.messageContent}
                  bounces={false}
                  showsVerticalScrollIndicator={false}>
                  <AppText size={13.5} color={theme.colors.text2} center style={styles.message}>
                    {dialog.message}
                  </AppText>
                </ScrollView>
              ) : null}
            </View>

            <View style={[styles.actions, stacked ? styles.actionsStacked : styles.actionsInline]}>
              {dialog.buttons.map((button, index) => (
                <DialogAction
                  key={`${button.text ?? 'OK'}-${index}`}
                  button={button}
                  stacked={stacked}
                  disabled={closing}
                  onPress={() => close(button)}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DialogAction({
  button,
  stacked,
  disabled,
  onPress,
}: {
  button: AlertButton;
  stacked: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const destructive = button.style === 'destructive';
  const secondary = button.style === 'cancel';
  const label = button.text || 'OK';

  if (secondary || stacked) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({pressed}) => [
          styles.actionBase,
          stacked ? styles.stackedAction : styles.inlineAction,
          {
            backgroundColor: pressed ? theme.colors.pressed : theme.colors.subtle,
            borderColor: destructive ? theme.colors.error : 'transparent',
            opacity: disabled ? 0.55 : 1,
          },
        ]}>
        <AppText
          size={13.5}
          weight="800"
          color={destructive ? theme.colors.error : secondary ? theme.colors.text2 : theme.colors.primary}
          center>
          {label}
        </AppText>
      </Pressable>
    );
  }

  if (destructive) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({pressed}) => [
          styles.actionBase,
          styles.inlineAction,
          styles.dangerAction,
          {backgroundColor: theme.colors.error, opacity: disabled ? 0.55 : pressed ? 0.88 : 1},
        ]}>
        <AppText size={13.5} weight="900" color="#FFFFFF" center>
          {label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [styles.inlineAction, {opacity: disabled ? 0.55 : pressed ? 0.9 : 1}]}>
      <Gradient colors={gradients.primaryButton} style={[styles.actionBase, styles.primaryAction]}>
        <AppText size={13.5} weight="900" color="#FFFFFF" center>
          {label}
        </AppText>
      </Gradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 34,
  },
  backdrop: {
    backgroundColor: 'rgba(5, 12, 28, 0.64)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    boxShadow: '0 24px 60px rgba(0, 18, 52, 0.30)',
  },
  accentBar: {
    height: 5,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  copy: {
    width: '100%',
    alignItems: 'center',
  },
  messageScroll: {
    width: '100%',
    maxHeight: 230,
    marginTop: 9,
  },
  messageContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  message: {
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  actionsInline: {
    flexDirection: 'row',
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  actionBase: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAction: {
    flex: 1,
    minWidth: 0,
  },
  stackedAction: {
    width: '100%',
    borderWidth: 1,
  },
  primaryAction: {
    width: '100%',
  },
  dangerAction: {
    boxShadow: '0 9px 18px rgba(229, 57, 53, 0.24)',
  },
});
