import React from 'react';
import {Pressable, ScrollView, TextInput, View} from 'react-native';
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

type ResetPasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoComplete: 'new-password';
  error?: string;
  onSubmitEditing?: () => void;
};

function ResetPasswordField({label, value, onChangeText, autoComplete, error, onSubmitEditing}: ResetPasswordFieldProps) {
  const [hidden, setHidden] = React.useState(true);

  return (
    <View style={styles.resetField}>
      <AppText weight="800" size={9.5} color="#757575" style={styles.resetFieldLabel}>
        {label}
      </AppText>
      <View style={[styles.resetInputSurface, error ? styles.resetInputError : null]}>
        <View style={styles.resetFieldIcon} accessibilityElementsHidden>
          <Icon name="lock" size={15} color={error ? colors.error : colors.primary} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder="••••••••"
          placeholderTextColor="#98A2B3"
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType="newPassword"
          secureTextEntry={hidden}
          returnKeyType={onSubmitEditing ? 'done' : 'next'}
          style={styles.resetTextInput}
        />
        <Pressable
          onPress={() => setHidden(current => !current)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={hidden ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`}>
          <Icon name="eye" size={16} color={colors.text3} />
        </Pressable>
      </View>
      {error ? <AppText accessibilityRole="alert" size={9.5} color={colors.error}>{error}</AppText> : null}
    </View>
  );
}

export function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const challengeId = (useRoute().params as {challengeId: string}).challengeId;
  const repos = useRepositories();
  const [password, setPassword] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const passwordValid = password.length >= 8;
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const canSubmit = passwordValid && passwordsMatch;
  const confirmationError = confirmation.length > 0 && !passwordsMatch ? 'Passwords do not match yet.' : undefined;

  const reset = useAsyncAction(async () => {
    if (!passwordValid) throw new Error('Use at least 8 characters for your new password.');
    if (password !== confirmation) throw new Error('The passwords do not match.');
    await repos.auth.resetPassword(challengeId, password);
    navigation.reset({index: 0, routes: [{name: 'Login'}]});
  });

  return (
    <Screen padded={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resetPage}>
        <Gradient
          colors={gradients.loginHero}
          start={{x: 0.08, y: 0}}
          end={{x: 0.92, y: 1}}
          style={styles.resetHero}>
          <View style={styles.resetGlowOne} accessibilityElementsHidden />
          <View style={styles.resetGlowTwo} accessibilityElementsHidden />

          <View style={styles.resetTopRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={({pressed}) => [styles.resetBackButton, pressed && styles.pressed]}>
              <Icon name="back" size={19} color="#fff" />
            </Pressable>
            <View style={styles.resetBrand} accessibilityElementsHidden>
              <RediLogo size={38} />
              <View>
                <AppText weight="900" size={11.5} color="#fff">RACI</AppText>
                <AppText weight="600" size={8.5} color="#BBDEFB">Learning made simple</AppText>
              </View>
            </View>
            <View style={styles.resetTopSpacer} />
          </View>

          <View style={styles.resetHeroContent}>
            <View style={styles.resetHeroIcon} accessibilityElementsHidden>
              <Icon name="shield" size={28} color={colors.primary} strokeWidth={2.15} />
              <View style={styles.resetHeroBadge}>
                <Icon name="check" size={11} color="#fff" strokeWidth={2.7} />
              </View>
            </View>
            <AppText weight="800" size={9} color="#90CAF9" style={styles.resetEyebrow}>
              SECURE RECOVERY
            </AppText>
            <AppText weight="900" size={24} color="#fff" center>
              Create a new password
            </AppText>
            <AppText size={11.5} weight="600" color="#D8E9FF" center style={styles.resetDescription}>
              Choose a strong password to keep your RACI account protected.
            </AppText>
          </View>
        </Gradient>

        <View style={styles.resetBody}>
          <View style={styles.resetCard}>
            <View style={styles.resetCardHeading}>
              <AppText weight="900" size={17} color={colors.navy} center>
                Set your new password
              </AppText>
              <AppText size={10} color={colors.text2} center style={styles.resetCardDescription}>
                Make it unique and easy for you to remember.
              </AppText>
            </View>

            <ResetPasswordField
              label="NEW PASSWORD"
              value={password}
              onChangeText={value => {
                setPassword(value);
                reset.clearError();
              }}
              autoComplete="new-password"
            />

            <View style={styles.resetRequirements}>
              <Icon name={passwordValid ? 'check' : 'shield'} size={13} color={passwordValid ? colors.success : colors.text3} />
              <AppText size={9.5} weight="600" color={passwordValid ? colors.success : colors.text2}>
                Use at least 8 characters for a stronger password.
              </AppText>
            </View>

            <ResetPasswordField
              label="CONFIRM NEW PASSWORD"
              value={confirmation}
              onChangeText={value => {
                setConfirmation(value);
                reset.clearError();
              }}
              autoComplete="new-password"
              error={confirmationError}
              onSubmitEditing={() => {
                if (canSubmit) void reset.run();
              }}
            />

            {confirmation.length > 0 && passwordsMatch ? (
              <View style={styles.resetMatchNotice}>
                <Icon name="check" size={14} color={colors.success} />
                <AppText size={9.5} weight="700" color={colors.success}>Passwords match</AppText>
              </View>
            ) : null}

            {reset.error ? (
              <View style={styles.resetError} accessibilityRole="alert">
                <Icon name="help" size={14} color={colors.error} />
                <AppText size={10} weight="600" color={colors.error} style={styles.resetErrorText}>
                  {reset.error}
                </AppText>
              </View>
            ) : null}

            <Pressable
              onPress={() => void reset.run()}
              disabled={!canSubmit || reset.busy}
              accessibilityRole="button"
              accessibilityState={{disabled: !canSubmit || reset.busy}}
              style={({pressed}) => [
                styles.resetSubmitPressable,
                pressed && styles.pressed,
                (!canSubmit || reset.busy) && styles.disabled,
              ]}>
              <Gradient colors={gradients.primaryButton} style={styles.resetSubmitButton}>
                <Icon name={reset.busy ? 'hourglass' : 'shield'} size={16} color="#fff" />
                <AppText weight="800" size={12} color="#fff">
                  {reset.busy ? 'Updating securely…' : 'Update password'}
                </AppText>
              </Gradient>
            </Pressable>

            <View style={styles.resetSecurityNote}>
              <Icon name="lock" size={13} color={colors.success} />
              <AppText size={9.5} weight="600" color={colors.text2} style={styles.resetSecurityText}>
                Your password is encrypted and never shared with anyone.
              </AppText>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            style={({pressed}) => [styles.resetSignIn, pressed && styles.pressed]}>
            <AppText weight="600" size={10.5} color={colors.text2}>Remembered your password? </AppText>
            <AppText weight="800" size={10.5} color={colors.primary}>Sign in</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
