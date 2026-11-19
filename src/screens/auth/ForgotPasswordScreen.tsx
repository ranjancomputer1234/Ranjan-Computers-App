import React from 'react';
import {Pressable, ScrollView, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRepositories} from '../../core/di';
import {AppText} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {Screen} from '../../components/layout/Screen';
import {useAsyncAction} from '../../core/useAsyncAction';
import {RediLogo} from '../../assets/illustrations';
import {colors, gradients} from '../../theme';
import {Icon} from '../../assets/icons';
import type {RootStackParamList} from '../../navigation/types';
import {styles} from './styles';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const repos = useRepositories();
  const [email, setEmail] = React.useState('');
  const [fieldError, setFieldError] = React.useState('');

  const send = useAsyncAction(async () => {
    const value = email.trim().toLowerCase();
    if (!emailPattern.test(value)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    setFieldError('');
    const result = await repos.auth.forgotPassword(value);
    navigation.navigate('VerifyContact', {challengeId: result.challengeId, mode: 'reset'});
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
                accessibilityLabel="Back to login"
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
              <AppText weight="700" size={12} color={colors.primary} style={styles.forgotStep}>
                Step 1 of 2
              </AppText>
              <AppText weight="800" size={22} color={colors.navy} center style={styles.welcome}>
                Reset your password
              </AppText>
              <AppText weight="500" size={14} color={colors.text2} center style={styles.forgotLead}>
                Enter the email address on your account. We’ll send a one-time code so you can set a new password.
              </AppText>
            </View>

            <View style={styles.field}>
              <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
                Email address
              </AppText>
              <View style={[styles.inputSurface, fieldError ? styles.forgotInputError : null]}>
                <Icon name="send" size={18} color={fieldError ? colors.error : colors.text3} />
                <TextInput
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    setFieldError('');
                    send.clearError();
                  }}
                  onSubmitEditing={() => void send.run()}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.text3}
                  accessibilityLabel="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  style={styles.textInput}
                />
              </View>
              {fieldError ? (
                <AppText accessibilityRole="alert" size={12} color={colors.error}>
                  {fieldError}
                </AppText>
              ) : null}
            </View>

            {send.error ? (
              <View style={styles.signupApiError} accessibilityRole="alert">
                <Icon name="help" size={16} color={colors.error} />
                <AppText size={13} weight="600" color={colors.error} style={styles.signupApiErrorText}>
                  {send.error}
                </AppText>
              </View>
            ) : null}

            <Pressable
              onPress={() => void send.run()}
              disabled={send.busy}
              accessibilityRole="button"
              accessibilityState={{disabled: send.busy}}
              style={({pressed}) => [styles.loginPressable, pressed && styles.pressed, send.busy && styles.disabled]}>
              <Gradient colors={gradients.primaryButton} style={styles.loginButton}>
                <AppText weight="700" size={16} color="#fff" center>
                  {send.busy ? 'Sending reset code…' : 'Send reset code'}
                </AppText>
              </Gradient>
            </Pressable>

            <View style={styles.signupTrustRow}>
              <Icon name="shield" size={15} color={colors.success} />
              <AppText size={12} weight="500" color={colors.text2} style={styles.forgotTrust}>
                The code is sent only by email. Keep it private.
              </AppText>
            </View>
          </View>

          <View style={styles.loginFooter}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Return to sign in"
              style={styles.loginLink}>
              <AppText weight="500" size={14} color={colors.text2}>Remember your password? </AppText>
              <AppText weight="700" size={14} color={colors.primary}>Sign in</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
