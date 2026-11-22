import React from 'react';
import {Animated, Modal, Pressable, ScrollView, TextInput, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRepositories} from '../../core/di';
import {AppText} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {Screen} from '../../components/layout/Screen';
import {RediLogo} from '../../assets/illustrations';
import {Icon} from '../../assets/icons';
import {useAsyncAction} from '../../core/useAsyncAction';
import {colors, gradients} from '../../theme';
import type {RootStackParamList} from '../../navigation/types';
import {styles} from './styles';

type PasswordFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  hidden: boolean;
  onChangeText: (value: string) => void;
  onToggleHidden: () => void;
  error?: string;
  onSubmitEditing?: () => void;
};

function PasswordField({
  label,
  value,
  placeholder,
  hidden,
  onChangeText,
  onToggleHidden,
  error,
  onSubmitEditing,
}: PasswordFieldProps) {
  return (
    <View style={styles.field}>
      <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
        {label}
      </AppText>
      <View style={[styles.inputSurface, error ? styles.forgotInputError : null]}>
        <Icon name="lock" size={18} color={error ? colors.error : colors.text3} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry={hidden}
          returnKeyType={onSubmitEditing ? 'done' : 'next'}
          style={styles.textInput}
        />
        <Pressable
          onPress={onToggleHidden}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
          <Icon name="eye" size={18} color={hidden ? colors.text3 : colors.primary} />
        </Pressable>
      </View>
      {error ? (
        <AppText accessibilityRole="alert" size={12} color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function PasswordRule({met, label}: {met: boolean; label: string}) {
  return (
    <View style={styles.passwordRule}>
      <View style={[styles.passwordDot, met ? styles.passwordDotMet : null]} />
      <AppText size={13} weight={met ? '700' : '500'} color={met ? colors.success : colors.text2}>
        {label}
      </AppText>
    </View>
  );
}

function PasswordUpdatedNotice({onContinue}: {onContinue: () => void}) {
  const card = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(card, {
      toValue: 1,
      damping: 16,
      stiffness: 190,
      mass: 0.72,
      useNativeDriver: true,
    }).start();
  }, [card]);

  const scale = card.interpolate({inputRange: [0, 1], outputRange: [0.86, 1]});
  const translateY = card.interpolate({inputRange: [0, 1], outputRange: [22, 0]});

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onContinue}>
      <View style={styles.successStage}>
        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[styles.successCard, {opacity: card, transform: [{translateY}, {scale}]}]}>
          <View style={styles.successAccent} />
          <View style={styles.successBody}>
            <View style={styles.successHalo}>
              <View style={styles.successRing}>
                <Gradient
                  colors={gradients.result}
                  start={{x: 0.2, y: 0}}
                  end={{x: 0.9, y: 1}}
                  style={styles.successRingFill}>
                  <Icon name="check" size={34} color="#fff" strokeWidth={2.6} />
                </Gradient>
              </View>
            </View>
            <AppText weight="700" size={12} color={colors.success} style={styles.successEyebrow}>
              You're all set
            </AppText>
            <AppText weight="800" size={24} color={colors.navy} center style={styles.successTitle}>
              Password updated
            </AppText>
            <AppText weight="500" size={14} color={colors.text2} center style={styles.successLead}>
              Your new password is saved. Sign in with it to get back to your courses.
            </AppText>
            <View style={styles.successNote}>
              <Icon name="lock" size={16} color={colors.success} />
              <AppText size={13} weight="600" color={colors.navy} style={styles.successNoteText}>
                Your previous password no longer works.
              </AppText>
            </View>
            <Pressable
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue to sign in"
              style={({pressed}) => [styles.successButton, pressed && styles.pressed]}>
              <Gradient colors={gradients.primaryButton} style={styles.loginButton}>
                <AppText weight="700" size={16} color="#fff" center>
                  Continue to sign in
                </AppText>
              </Gradient>
            </Pressable>
            <AppText weight="500" size={12} color={colors.text3} center style={styles.successHint}>
              Opening sign in…
            </AppText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const challengeId = (useRoute().params as {challengeId: string}).challengeId;
  const repos = useRepositories();
  const [password, setPassword] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const [hidePassword, setHidePassword] = React.useState(true);
  const [hideConfirmation, setHideConfirmation] = React.useState(true);
  const [updated, setUpdated] = React.useState(false);
  const wentToLogin = React.useRef(false);
  const passwordValid = password.length >= 8;
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const canSubmit = passwordValid && passwordsMatch;
  const confirmationError = confirmation.length > 0 && !passwordsMatch ? 'Passwords do not match yet.' : undefined;

  const goToLogin = React.useCallback(() => {
    if (wentToLogin.current) return;
    wentToLogin.current = true;
    navigation.reset({index: 0, routes: [{name: 'Login'}]});
  }, [navigation]);

  React.useEffect(() => {
    if (!updated) return;
    const timer = setTimeout(goToLogin, 2800);
    return () => clearTimeout(timer);
  }, [goToLogin, updated]);

  const reset = useAsyncAction(async () => {
    if (!passwordValid) throw new Error('Use at least 8 characters for your new password.');
    if (password !== confirmation) throw new Error('The passwords do not match.');
    await repos.auth.resetPassword(challengeId, password);
    setPassword('');
    setConfirmation('');
    setUpdated(true);
  });

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
              <View style={styles.otpSteps} accessibilityElementsHidden>
                <View style={[styles.otpStepMark, styles.otpStepDone]} />
                <View style={[styles.otpStepMark, styles.otpStepDone]} />
                <View style={[styles.otpStepMark, styles.otpStepCurrent]} />
              </View>
              <AppText weight="700" size={12} color={colors.primary} style={styles.forgotStep}>
                Step 3 of 3
              </AppText>
              <AppText weight="800" size={22} color={colors.navy} center style={styles.welcome}>
                Create a new password
              </AppText>
              <AppText weight="500" size={14} color={colors.text2} center style={styles.forgotLead}>
                Choose a strong password to keep your RACI account protected.
              </AppText>
            </View>

            <PasswordField
              label="New password"
              value={password}
              placeholder="At least 8 characters"
              hidden={hidePassword}
              onToggleHidden={() => setHidePassword(current => !current)}
              onChangeText={value => {
                setPassword(value);
                reset.clearError();
              }}
            />

            <PasswordField
              label="Confirm new password"
              value={confirmation}
              placeholder="Re-enter your password"
              hidden={hideConfirmation}
              onToggleHidden={() => setHideConfirmation(current => !current)}
              error={confirmationError}
              onChangeText={value => {
                setConfirmation(value);
                reset.clearError();
              }}
              onSubmitEditing={() => {
                if (canSubmit) void reset.run();
              }}
            />

            <View style={styles.passwordRules}>
              <PasswordRule met={passwordValid} label="At least 8 characters" />
              <PasswordRule met={passwordsMatch} label="Both passwords match" />
            </View>

            {reset.error ? (
              <View style={styles.signupApiError} accessibilityRole="alert">
                <Icon name="help" size={16} color={colors.error} />
                <AppText size={13} weight="600" color={colors.error} style={styles.signupApiErrorText}>
                  {reset.error}
                </AppText>
              </View>
            ) : null}

            <Pressable
              onPress={() => void reset.run()}
              disabled={!canSubmit || reset.busy || updated}
              accessibilityRole="button"
              accessibilityState={{disabled: !canSubmit || reset.busy || updated}}
              style={({pressed}) => [
                styles.loginPressable,
                pressed && styles.pressed,
                (!canSubmit || reset.busy || updated) && styles.disabled,
              ]}>
              <Gradient colors={gradients.primaryButton} style={styles.loginButton}>
                <AppText weight="700" size={16} color="#fff" center>
                  {reset.busy ? 'Updating password…' : 'Update password'}
                </AppText>
              </Gradient>
            </Pressable>

            <View style={styles.signupTrustRow}>
              <Icon name="lock" size={15} color={colors.success} />
              <AppText size={12} weight="500" color={colors.text2} style={styles.forgotTrust}>
                Your password is encrypted and never shared with anyone.
              </AppText>
            </View>
          </View>

          <View style={styles.loginFooter}>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
              style={styles.loginLink}>
              <AppText weight="500" size={14} color={colors.text2}>Remembered your password?</AppText>
              <AppText weight="500" size={14} color={colors.text2}> </AppText>
              <AppText weight="700" size={14} color={colors.primary}>Sign in</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {updated ? <PasswordUpdatedNotice onContinue={goToLogin} /> : null}
    </Screen>
  );
}
