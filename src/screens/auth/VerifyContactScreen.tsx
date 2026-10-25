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

const copyByMode: Record<VerificationMode, {eyebrow: string; title: string; description: string}> = {
  register: {
    eyebrow: 'FINAL STEP',
    title: 'Verify your number',
    description: 'We sent a 6-digit code to the mobile number you provided.',
  },
  reset: {
    eyebrow: 'SECURE RECOVERY',
    title: 'Check your inbox',
    description: 'We sent a 6-digit code to your registered email or mobile number.',
  },
  profile: {
    eyebrow: 'CONFIRM YOUR CHANGE',
    title: 'Verify your contact',
    description: 'Enter the 6-digit code we sent to confirm your new contact details.',
  },
};

export function VerifyContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {challengeId, mode} = useRoute().params as {challengeId: string; mode: VerificationMode};
  const repos = useRepositories();
  const setAuthenticated = useSessionStore(s => s.setAuthenticated);
  const inputRef = React.useRef<React.ElementRef<typeof TextInput>>(null);
  const [code, setCode] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const screenCopy = copyByMode[mode];

  const verify = useAsyncAction(async () => {
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the complete 6-digit verification code.');
    if (mode === 'reset') {
      const result = await repos.auth.verifyResetCode(challengeId, code);
      navigation.replace('ResetPassword', {challengeId: result.resetToken});
      return;
    }
    const result = await repos.auth.verifyChallenge(challengeId, code);
    await setAuthenticated(result.tokens, result.profile);
  });

  const changeCode = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    verify.clearError();
  };

  return (
    <Screen padded={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.verifyPage}>
        <Gradient
          colors={gradients.loginHero}
          start={{x: 0.08, y: 0}}
          end={{x: 0.92, y: 1}}
          style={styles.verifyHero}>
          <View style={styles.verifyGlowOne} accessibilityElementsHidden />
          <View style={styles.verifyGlowTwo} accessibilityElementsHidden />

          <View style={styles.verifyTopRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={({pressed}) => [styles.verifyBackButton, pressed && styles.pressed]}>
              <Icon name="back" size={19} color="#fff" />
            </Pressable>
            <View style={styles.verifyBrand} accessibilityElementsHidden>
              <RediLogo size={38} />
              <View>
                <AppText weight="900" size={11.5} color="#fff">RACI</AppText>
                <AppText weight="600" size={8.5} color="#BBDEFB">Learning made simple</AppText>
              </View>
            </View>
            <View style={styles.verifyTopSpacer} />
          </View>

          <View style={styles.verifyHeroContent}>
            <View style={styles.verifyHeroIcon} accessibilityElementsHidden>
              <Icon name="chat" size={27} color={colors.primary} strokeWidth={2.2} />
              <View style={styles.verifyHeroBadge}>
                <Icon name="check" size={11} color="#fff" strokeWidth={2.7} />
              </View>
            </View>
            <AppText weight="800" size={9} color="#90CAF9" style={styles.verifyEyebrow}>
              {screenCopy.eyebrow}
            </AppText>
            <AppText weight="900" size={24} color="#fff" center>
              {screenCopy.title}
            </AppText>
            <AppText size={11.5} weight="600" color="#D8E9FF" center style={styles.verifyDescription}>
              {screenCopy.description}
            </AppText>
          </View>
        </Gradient>

        <View style={styles.verifyBody}>
          <View style={styles.verifyCard}>
            <View style={styles.verifyCardHeading}>
              <AppText weight="900" size={17} color={colors.navy} center>
                Enter verification code
              </AppText>
              <AppText size={10} color={colors.text2} center style={styles.verifyCardDescription}>
                Type the one-time code exactly as it appears.
              </AppText>
            </View>

            <View style={styles.verifyCodeField}>
              <View style={styles.verifyCodeRow} accessibilityElementsHidden>
                {Array.from({length: 6}, (_, index) => {
                  const digit = code[index];
                  const active = focused && index === Math.min(code.length, 5);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.verifyCodeCell,
                        digit ? styles.verifyCodeCellFilled : null,
                        active ? styles.verifyCodeCellActive : null,
                        verify.error ? styles.verifyCodeCellError : null,
                      ]}>
                      <AppText face="mono" weight="800" size={20} color={colors.navy}>
                        {digit || ''}
                      </AppText>
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
                onSubmitEditing={() => code.length === 6 && void verify.run()}
                accessibilityLabel="6-digit verification code"
                accessibilityHint="Enter the code sent to your contact"
                keyboardType="number-pad"
                inputMode="numeric"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                maxLength={6}
                returnKeyType="done"
                caretHidden
                selectionColor="transparent"
                style={styles.verifyHiddenInput}
              />
            </View>

            {verify.error ? (
              <View style={styles.verifyError} accessibilityRole="alert">
                <Icon name="help" size={14} color={colors.error} />
                <AppText size={10} weight="600" color={colors.error} style={styles.verifyErrorText}>
                  {verify.error}
                </AppText>
              </View>
            ) : null}

            <Pressable
              onPress={() => void verify.run()}
              disabled={verify.busy || code.length !== 6}
              accessibilityRole="button"
              accessibilityState={{disabled: verify.busy || code.length !== 6}}
              style={({pressed}) => [
                styles.verifySubmitPressable,
                pressed && styles.pressed,
                (verify.busy || code.length !== 6) && styles.disabled,
              ]}>
              <Gradient colors={gradients.primaryButton} style={styles.verifySubmitButton}>
                {verify.busy ? <Icon name="hourglass" size={16} color="#fff" /> : <Icon name="shield" size={16} color="#fff" />}
                <AppText weight="800" size={12} color="#fff">
                  {verify.busy ? 'Verifying securely…' : mode === 'reset' ? 'Verify & continue' : 'Verify my account'}
                </AppText>
              </Gradient>
            </Pressable>

            <View style={styles.verifySecurityNote}>
              <Icon name="lock" size={13} color={colors.success} />
              <AppText size={9.5} weight="600" color={colors.text2} style={styles.verifySecurityText}>
                Keep this code private. RACI will never ask you to share it.
              </AppText>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back and request another code"
            style={({pressed}) => [styles.verifyAnotherCode, pressed && styles.pressed]}>
            <AppText weight="600" size={10.5} color={colors.text2}>Didn’t receive the code? </AppText>
            <AppText weight="800" size={10.5} color={colors.primary}>Try again</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
