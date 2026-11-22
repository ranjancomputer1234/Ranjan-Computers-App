import React from 'react';
import {Pressable, ScrollView, TextInput, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RediLogo} from '../../assets/illustrations';
import {Icon} from '../../assets/icons';
import {AppText} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {Screen} from '../../components/layout/Screen';
import {useRepositories} from '../../core/di';
import {useSessionStore} from '../../core/session';
import {useAsyncAction} from '../../core/useAsyncAction';
import type {RootStackParamList} from '../../navigation/types';
import {colors, gradients} from '../../theme';
import {styles} from './styles';

type VerificationMode = 'register' | 'reset' | 'profile';

const RESEND_WAIT_SECONDS = 45;

const copyByMode: Record<
  VerificationMode,
  {step: string; title: string; lead: string; action: string; footerLead: string; footerAction: string}
> = {
  register: {
    step: 'Last step',
    title: 'Verify your email',
    lead: 'Enter the 6-digit code we sent. Your account is created once it is confirmed.',
    action: 'Verify and create account',
    footerLead: 'Wrong email?',
    footerAction: 'Edit details',
  },
  reset: {
    step: 'Step 2 of 3',
    title: 'Enter the code',
    lead: 'We sent a one-time code so you can set a new password.',
    action: 'Verify and continue',
    footerLead: 'Wrong email?',
    footerAction: 'Change it',
  },
  profile: {
    step: 'Confirm change',
    title: 'Verify your contact',
    lead: 'Enter the 6-digit code we sent to confirm your new contact details.',
    action: 'Confirm change',
    footerLead: 'Need to start over?',
    footerAction: 'Go back',
  },
};

function waitLabel(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`;
}

function maskDestination(value: string) {
  const trimmed = value.trim();
  const at = trimmed.lastIndexOf('@');
  if (at > 0) {
    const local = trimmed.slice(0, at);
    const head = local.slice(0, local.length <= 2 ? 1 : 2);
    return `${head}••••${trimmed.slice(at)}`;
  }
  if (trimmed.length <= 4) return '••••';
  return `${trimmed.slice(0, 2)}••••${trimmed.slice(-2)}`;
}

export function VerifyContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {challengeId, mode, sentTo} = useRoute().params as RootStackParamList['VerifyContact'];
  const repos = useRepositories();
  const setAuthenticated = useSessionStore(s => s.setAuthenticated);
  const inputRef = React.useRef<React.ElementRef<typeof TextInput>>(null);
  const submittedCode = React.useRef('');
  const verifyRun = React.useRef<() => Promise<void>>(async () => {});
  const screenCopy = copyByMode[mode];
  const canResend = mode === 'reset' && Boolean(sentTo?.includes('@'));

  const [challenge, setChallenge] = React.useState(challengeId);
  const [code, setCode] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [caretOn, setCaretOn] = React.useState(true);
  const [wait, setWait] = React.useState(canResend ? RESEND_WAIT_SECONDS : 0);
  const [resent, setResent] = React.useState(false);

  const verify = useAsyncAction(async () => {
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the complete 6-digit verification code.');
    if (mode === 'reset') {
      const result = await repos.auth.verifyResetCode(challenge, code);
      navigation.replace('ResetPassword', {challengeId: result.resetToken});
      return;
    }
    const result = await repos.auth.verifyChallenge(challenge, code);
    await setAuthenticated(result.tokens, result.profile);
  });
  verifyRun.current = verify.run;

  const resend = useAsyncAction(async () => {
    if (!canResend || !sentTo || wait > 0) return;
    const result = await repos.auth.forgotPassword(sentTo);
    setChallenge(result.challengeId);
    setCode('');
    submittedCode.current = '';
    setResent(true);
    setWait(RESEND_WAIT_SECONDS);
    inputRef.current?.focus();
  });

  React.useEffect(() => {
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(focusTimer);
  }, []);

  React.useEffect(() => {
    const blink = setInterval(() => setCaretOn(value => !value), 520);
    return () => clearInterval(blink);
  }, []);

  React.useEffect(() => {
    if (!canResend) return;
    const timer = setInterval(() => setWait(current => (current > 0 ? current - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [canResend]);

  React.useEffect(() => {
    if (code.length < 6) {
      submittedCode.current = '';
      return;
    }
    if (submittedCode.current === code) return;
    const timer = setTimeout(() => {
      submittedCode.current = code;
      void verifyRun.current();
    }, 180);
    return () => clearTimeout(timer);
  }, [code]);

  const changeCode = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setResent(false);
    verify.clearError();
    resend.clearError();
  };

  const notice = verify.error || resend.error;
  const ready = code.length === 6;

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.loginScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.loginPage}>
        <View style={styles.loginStage}>
          <Gradient
            colors={gradients.loginHero}
            start={{x: 0.08, y: 0}}
            end={{x: 0.92, y: 1}}
            style={styles.forgotBrand}>
            <View style={styles.forgotTopRow}>
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                style={({pressed}) => [styles.forgotBackButton, pressed && styles.pressed]}>
                <Icon name="back" size={20} color="#fff" />
              </Pressable>
              <View style={styles.forgotTopSpacer} />
            </View>
            <RediLogo size={64} />
            <AppText weight="800" size={20} color="#fff" center style={styles.loginInstitute}>
              Ranjan Computer Institute
            </AppText>
            <AppText weight="600" size={12} color="#FFD54F" center style={styles.loginTagline}>
              Learn Computer With AI
            </AppText>
          </Gradient>

          <View style={styles.formCard}>
            <View style={styles.loginHeading}>
              {mode === 'reset' ? (
                <View style={styles.otpSteps} accessibilityElementsHidden>
                  <View style={[styles.otpStepMark, styles.otpStepDone]} />
                  <View style={[styles.otpStepMark, styles.otpStepCurrent]} />
                  <View style={[styles.otpStepMark, styles.otpStepPending]} />
                </View>
              ) : null}
              <AppText weight="700" size={12} color={colors.primary} style={styles.forgotStep}>
                {screenCopy.step}
              </AppText>
              <AppText weight="800" size={22} color={colors.navy} center style={styles.welcome}>
                {screenCopy.title}
              </AppText>
              <AppText weight="500" size={14} color={colors.text2} center style={styles.forgotLead}>
                {screenCopy.lead}
              </AppText>
              {sentTo ? (
                <View style={styles.otpDestination}>
                  <Icon name="send" size={15} color={colors.primary} />
                  <AppText
                    weight="700"
                    size={13}
                    color={colors.navy}
                    numberOfLines={1}
                    translate={false}
                    style={styles.otpDestinationText}>
                    {maskDestination(sentTo)}
                  </AppText>
                </View>
              ) : null}
            </View>

            <View style={styles.otpField}>
              <View style={styles.otpRow} accessibilityElementsHidden>
                {Array.from({length: 6}, (_, index) => {
                  const digit = code[index];
                  const active = focused && code.length < 6 && index === code.length;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpCell,
                        index === 3 ? styles.otpCellGrouped : null,
                        digit ? styles.otpCellFilled : null,
                        active ? styles.otpCellActive : null,
                        verify.error ? styles.otpCellError : null,
                      ]}>
                      {digit ? (
                        <AppText face="mono" weight="800" size={22} color={colors.navy} translate={false}>
                          {digit}
                        </AppText>
                      ) : active ? (
                        <View style={[styles.otpCaret, {opacity: caretOn ? 1 : 0}]} />
                      ) : (
                        <View style={styles.otpDash} />
                      )}
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={changeCode}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={() => ready && void verify.run()}
                accessibilityLabel="6-digit verification code"
                accessibilityHint="Enter the code sent to your email"
                keyboardType="number-pad"
                inputMode="numeric"
                autoComplete={mode === 'register' || mode === 'reset' ? 'one-time-code' : 'sms-otp'}
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                maxLength={6}
                caretHidden
                selectionColor="transparent"
                style={styles.otpInput}
              />
            </View>

            {notice ? (
              <View style={styles.signupApiError} accessibilityRole="alert">
                <Icon name="help" size={16} color={colors.error} />
                <AppText size={13} weight="600" color={colors.error} style={styles.signupApiErrorText}>
                  {notice}
                </AppText>
              </View>
            ) : resent ? (
              <View style={styles.otpSentNote}>
                <Icon name="check" size={16} color={colors.success} />
                <AppText size={13} weight="600" color={colors.success} style={styles.signupApiErrorText}>
                  A new code is on its way.
                </AppText>
              </View>
            ) : null}

            <Pressable
              onPress={() => void verify.run()}
              disabled={verify.busy || !ready}
              accessibilityRole="button"
              accessibilityState={{disabled: verify.busy || !ready}}
              style={({pressed}) => [styles.loginPressable, pressed && styles.pressed, (verify.busy || !ready) && styles.disabled]}>
              <Gradient colors={gradients.primaryButton} style={styles.loginButton}>
                <AppText weight="700" size={16} color="#fff" center>
                  {verify.busy ? 'Verifying…' : screenCopy.action}
                </AppText>
              </Gradient>
            </Pressable>

            <View style={styles.otpResend}>
              <AppText weight="500" size={14} color={colors.text2}>
                Didn't get the code?
              </AppText>
              {canResend && wait > 0 && !resend.busy ? (
                <AppText weight="700" size={14} color={colors.text3}>
                  Resend in{' '}
                  <AppText weight="700" size={14} color={colors.text3} translate={false}>
                    {waitLabel(wait)}
                  </AppText>
                </AppText>
              ) : canResend ? (
                <Pressable
                  onPress={() => void resend.run()}
                  disabled={resend.busy}
                  accessibilityRole="button"
                  accessibilityState={{disabled: resend.busy}}
                  hitSlop={8}>
                  <AppText weight="700" size={14} color={resend.busy ? colors.text3 : colors.primary}>
                    {resend.busy ? 'Sending a new code…' : 'Resend code'}
                  </AppText>
                </Pressable>
              ) : (
                <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" hitSlop={8}>
                  <AppText weight="700" size={14} color={colors.primary}>
                    Request a new code
                  </AppText>
                </Pressable>
              )}
            </View>

            <View style={styles.signupTrustRow}>
              <Icon name="verify" size={15} color={colors.success} />
              <AppText size={12} weight="500" color={colors.text2} style={styles.forgotTrust}>
                Keep this code private. RACI will never ask you to share it.
              </AppText>
            </View>
          </View>

          <View style={styles.loginFooter}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              style={styles.loginLink}>
              <AppText weight="500" size={14} color={colors.text2}>
                {screenCopy.footerLead}{' '}
              </AppText>
              <AppText weight="700" size={14} color={colors.primary}>
                {screenCopy.footerAction}
              </AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
