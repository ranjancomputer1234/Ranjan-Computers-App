import React from 'react';
import {Pressable, ScrollView, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors, gradients} from '../../theme';
import {AppText} from '../../components/ui';
import {Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {RediLogo} from '../../assets/illustrations';
import {Icon} from '../../assets/icons';
import type {RootStackParamList} from '../../navigation/types';
import {useLogin} from '../../features/auth/hooks/useLogin';
import {styles} from './styles';
import {useUiTranslation} from '../../features/settings/uiTranslations';

export function LoginScreen() {
  const tx = useUiTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {form, busy, onSubmit, enterGuest} = useLogin();
  const [passwordHidden, setPasswordHidden] = React.useState(true);

  const identifier = form.watch('identifier');
  const identifierError = form.formState.errors.identifier?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.loginScroll}
        contentContainerStyle={styles.loginPage}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.loginStage}>
          <Gradient
            colors={gradients.loginHero}
            start={{x: 0.08, y: 0}}
            end={{x: 0.92, y: 1}}
            style={styles.loginBrand}>
            <RediLogo size={72} />
            <AppText weight="800" size={22} color="#fff" center style={styles.loginInstitute}>
              Ranjan Computer Institute
            </AppText>
            <AppText weight="600" size={12} color="#FFD54F" center style={styles.loginTagline}>
              Learn Computer With AI
            </AppText>
            <View style={styles.loginBoard}>
              <AppText face="caveat" weight="700" size={18} color="#ECEFF1" style={styles.loginChalk}>
                Learn <AppText face="caveat" weight="700" size={18} color="#ECEFF1" style={styles.loginGrow}>Grow</AppText>
              </AppText>
              <AppText face="caveat" weight="700" size={18} color="#ECEFF1" style={styles.loginChalk}>
                Succeed
              </AppText>
            </View>
          </Gradient>

          <View style={styles.formCard}>
            <View style={styles.loginHeading}>
              <AppText weight="800" size={22} color={colors.navy} center style={styles.welcome}>
                Welcome back
              </AppText>
              <AppText weight="500" size={14} color={colors.text2} center>
                Sign in to continue learning
              </AppText>
            </View>

            <View style={styles.field}>
              <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
                Email address
              </AppText>
              <View style={styles.inputSurface}>
                <Icon name="user" size={18} color={colors.text3} />
                <TextInput
                  value={identifier}
                  onChangeText={text => form.setValue('identifier', text, {shouldValidate: Boolean(identifierError)})}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.text3}
                  accessibilityLabel="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  style={styles.textInput}
                />
              </View>
              {identifierError ? <AppText size={12} color={colors.error}>{identifierError}</AppText> : null}
            </View>

            <View style={styles.field}>
              <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
                Password
              </AppText>
              <View style={styles.inputSurface}>
                <Icon name="lock" size={18} color={colors.text3} />
                <TextInput
                  value={form.watch('password')}
                  onChangeText={text => form.setValue('password', text, {shouldValidate: Boolean(passwordError)})}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.text3}
                  accessibilityLabel={tx('Password')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  secureTextEntry={passwordHidden}
                  style={styles.textInput}
                />
                <Pressable
                  onPress={() => setPasswordHidden(hidden => !hidden)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={tx(passwordHidden ? 'Show password' : 'Hide password')}>
                  <Icon name="eye" size={18} color={colors.text3} />
                </Pressable>
              </View>
              {passwordError ? <AppText size={12} color={colors.error}>{passwordError}</AppText> : null}
            </View>

            <Pressable
              onPress={() => {
                onSubmit();
              }}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{disabled: busy}}
              style={({pressed}) => [styles.loginPressable, pressed && styles.pressed, busy && styles.disabled]}>
              <Gradient colors={gradients.primaryButton} style={styles.loginButton}>
                <AppText weight="700" size={16} color="#fff" center>
                  {busy ? 'Signing in…' : 'Login to Continue'}
                </AppText>
              </Gradient>
            </Pressable>
          </View>

          <View style={styles.loginFooter}>
            <Pressable
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              style={styles.loginLink}>
              <AppText weight="500" size={14} color={colors.text2}>New to RACI? </AppText>
              <AppText weight="700" size={14} color={colors.primary}>Create an account</AppText>
            </Pressable>

            <Pressable onPress={() => enterGuest()} accessibilityRole="button" style={styles.loginLink}>
              <AppText weight="600" size={14} color={colors.primary}>Browse as guest</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
