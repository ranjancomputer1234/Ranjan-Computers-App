import React from 'react';
import {Pressable, ScrollView, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRepositories} from '../../core/di';
import {AppText} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {Screen} from '../../components/layout/Screen';
import {useAsyncAction} from '../../core/useAsyncAction';
import {RediLogo} from '../../assets/illustrations';
import {colors, gradients} from '../../theme';
import {Icon} from '../../assets/icons';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';
import {styles} from './styles';
import {useUiTranslation} from '../../features/settings/uiTranslations';

export function ForgotPasswordScreen() {
  const tx = useUiTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const repos = useRepositories();
  const [identifier, setIdentifier] = React.useState('');
  const [fieldError, setFieldError] = React.useState('');
  const isPhone = identifier.length === 0 || /^\d+$/.test(identifier);

  const changeIdentifier = (text: string) => {
    const nextValue = /^[+\d\s-]*$/.test(text)
      ? text.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10)
      : text;
    setIdentifier(nextValue);
    setFieldError('');
  };

  const send = useAsyncAction(async () => {
    const value = identifier.trim();
    const validPhone = /^[6-9]\d{9}$/.test(value);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!validPhone && !validEmail) {
      setFieldError('Enter a valid email address or 10-digit mobile number.');
      return;
    }
    setFieldError('');
    const result = await repos.auth.forgotPassword(validEmail ? value.toLowerCase() : value);
    navigation.navigate('VerifyContact', {challengeId: result.challengeId, mode: 'reset'});
  });

  return (
    <Screen padded={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.forgotPage}>
        <Gradient
          colors={gradients.loginHero}
          start={{x: 0.08, y: 0}}
          end={{x: 0.92, y: 1}}
          style={styles.recoveryHero}>
          <View style={styles.recoveryGlowOne} accessibilityElementsHidden />
          <View style={styles.recoveryGlowTwo} accessibilityElementsHidden />

          <View style={styles.recoveryTopRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back to login"
              hitSlop={8}
              style={({pressed}) => [styles.recoveryBackButton, pressed && styles.pressed]}>
              <Icon name="back" size={19} color="#fff" />
            </Pressable>
            <View style={styles.recoveryBrand} accessibilityElementsHidden>
              <RediLogo size={38} />
              <View>
                <AppText weight="900" size={11.5} color="#fff">RACI</AppText>
                <AppText weight="600" size={8.5} color="#BBDEFB">Learning made simple</AppText>
              </View>
            </View>
            <View style={styles.recoveryTopSpacer} />
          </View>

          <View style={styles.recoveryHeading}>
            <View style={styles.recoveryIcon} accessibilityElementsHidden>
              <Icon name="lock" size={27} color={colors.primary} strokeWidth={2.25} />
            </View>
            <AppText weight="900" size={24} color="#fff" center>
              Let’s get you back in
            </AppText>
            <AppText size={11.5} weight="600" color="#D8E9FF" center style={styles.recoveryDescription}>
              Recover your account in just two quick steps.
            </AppText>
          </View>
        </Gradient>

        <View style={styles.recoveryBody}>
          <View style={styles.recoveryCard}>
          <View style={styles.recoveryCardHeading}>
            <AppText weight="900" size={17} color={colors.navy}>
              Find your account
            </AppText>
            <AppText size={10.5} color={colors.text2} style={styles.recoveryCardDescription}>
              Enter the email address or mobile number linked to your RACI account.
            </AppText>
          </View>

          <View style={styles.recoveryField}>
            <AppText weight="800" size={9.5} color="#757575" style={styles.recoveryLabel}>
              EMAIL ADDRESS OR MOBILE NUMBER
            </AppText>
            <View style={[styles.recoveryInputSurface, fieldError ? styles.recoveryInputError : null]}>
              <View style={styles.recoveryFieldIcon} accessibilityElementsHidden>
                <Icon name={isPhone ? 'chat' : 'send'} size={15} color={fieldError ? colors.error : colors.primary} />
              </View>
              {isPhone ? <AppText weight="800" size={12} color={colors.primary}>+91</AppText> : null}
              <TextInput
                value={identifier}
                onChangeText={changeIdentifier}
                onSubmitEditing={() => void send.run()}
                placeholder={tx(isPhone ? '10-digit mobile number' : 'name@example.com')}
                placeholderTextColor="#98A2B3"
                accessibilityLabel={tx('Email address or mobile number')}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={isPhone ? 'tel' : 'email'}
                keyboardType="email-address"
                returnKeyType="send"
                textContentType={isPhone ? 'telephoneNumber' : 'emailAddress'}
                style={styles.recoveryTextInput}
              />
            </View>
            {fieldError ? (
              <AppText accessibilityRole="alert" size={9.5} color={colors.error}>
                {fieldError}
              </AppText>
            ) : null}
          </View>

          {send.error ? (
            <View style={styles.recoveryError} accessibilityRole="alert">
              <Icon name="help" size={14} color={colors.error} />
              <AppText size={10} weight="600" color={colors.error} style={styles.recoveryErrorText}>
                {send.error}
              </AppText>
            </View>
          ) : null}

          <Pressable
            onPress={() => void send.run()}
            disabled={send.busy}
            accessibilityRole="button"
            accessibilityState={{disabled: send.busy}}
            style={({pressed}) => [styles.recoverySubmitPressable, pressed && styles.pressed, send.busy && styles.disabled]}>
            <Gradient colors={gradients.primaryButton} style={styles.recoverySubmitButton}>
              <AppText weight="800" size={12} color="#fff">
                {send.busy ? 'Sending verification code…' : 'Continue securely'}
              </AppText>
              {!send.busy ? <Icon name="chev" size={16} color="#fff" /> : null}
            </Gradient>
          </Pressable>

          <View style={styles.recoveryNote}>
            <Icon name="shield" size={14} color={colors.success} />
            <AppText size={9.5} weight="600" color={colors.text2} style={styles.recoveryNoteText}>
              We’ll send a one-time verification code. Your details stay private and secure.
            </AppText>
          </View>
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Return to sign in"
            style={styles.recoverySignIn}>
            <AppText weight="600" size={10.5} color={colors.text2}>Remember your password? </AppText>
            <AppText weight="800" size={10.5} color={colors.primary}>Sign in</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
