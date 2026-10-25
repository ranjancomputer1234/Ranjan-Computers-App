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
import {DEV_SEED_ACCOUNTS} from '../../features/auth/devSeedAccounts';
import {appConfig} from '../../core/config';
import {styles} from './styles';
import {useUiTranslation} from '../../features/settings/uiTranslations';

export function LoginScreen() {
  const tx = useUiTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {form, busy, onSubmit, loginWithSeedAccount, enterGuest} = useLogin();
  const [passwordHidden, setPasswordHidden] = React.useState(true);

  const identifier = form.watch('identifier');
  const identifierError = form.formState.errors.identifier?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.loginPage}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Gradient
          colors={gradients.loginHero}
          start={{x: 0.08, y: 0}}
          end={{x: 0.92, y: 1}}
          style={styles.hero}>
          <RediLogo size={66} />
          <AppText weight="900" size={20} color="#fff" center style={styles.instituteName}>
            Ranjan Computer Institute
          </AppText>
          <AppText weight="600" size={10} color="#FFD54F" center style={styles.tagline}>
            Learn Computer With AI
          </AppText>
          <View style={styles.chalkboard}>
            <AppText face="caveat" weight="700" size={15} color="#ECEFF1" style={styles.chalkText}>
              Learn <AppText face="caveat" weight="700" size={15} color="#ECEFF1" style={styles.growText}>Grow</AppText>
            </AppText>
            <AppText face="caveat" weight="700" size={15} color="#ECEFF1" style={styles.chalkText}>
              Succeed
            </AppText>
          </View>
        </Gradient>

        <View style={styles.formCard}>
          <AppText weight="900" size={16} color={colors.navy} center style={styles.welcome}>
            Welcome Back!
          </AppText>

          <View style={styles.field}>
            <AppText weight="800" size={9.5} color="#757575" style={styles.fieldLabel}>
              Email address
            </AppText>
            <View style={styles.inputSurface}>
              <TextInput
                value={identifier}
                onChangeText={text => form.setValue('identifier', text, {shouldValidate: Boolean(identifierError)})}
                placeholder="name@example.com"
                placeholderTextColor={colors.ink}
                accessibilityLabel="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                style={styles.textInput}
              />
            </View>
            {identifierError ? <AppText size={10} color={colors.error}>{identifierError}</AppText> : null}
          </View>

          <View style={styles.field}>
            <AppText weight="800" size={9.5} color="#757575" style={styles.fieldLabel}>
              Password
            </AppText>
            <View style={styles.inputSurface}>
              <Icon name="lock" size={15} color="#9E9E9E" />
              <TextInput
                value={form.watch('password')}
                onChangeText={text => form.setValue('password', text, {shouldValidate: Boolean(passwordError)})}
                placeholder="••••••••"
                placeholderTextColor={colors.ink}
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
                <Icon name="eye" size={15} color="#9E9E9E" />
              </Pressable>
            </View>
            {passwordError ? <AppText size={10} color={colors.error}>{passwordError}</AppText> : null}
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
              <AppText weight="800" size={12} color="#fff" center>
                {busy ? 'Signing in…' : 'Login to Continue'}
              </AppText>
            </Gradient>
          </Pressable>
        </View>

        {DEV_SEED_ACCOUNTS.length ? (
          <View style={styles.seedCard}>
            <View style={styles.seedHeading}>
              <View style={styles.seedIcon}>
                <Icon name="user" size={14} color={colors.primary} />
              </View>
              <View style={styles.seedHeadingCopy}>
                <AppText weight="900" size={13} color={colors.navy}>
                  Debug login
                </AppText>
                <AppText size={9.5} color={colors.text2}>
                  Development only · {appConfig.apiBaseUrl}
                </AppText>
              </View>
            </View>
            {DEV_SEED_ACCOUNTS.map(account => (
              <Pressable
                key={account.email}
                accessibilityRole="button"
                accessibilityLabel={`Sign in as ${account.name}`}
                accessibilityState={{disabled: busy}}
                disabled={busy}
                onPress={() =>
                  loginWithSeedAccount({
                    identifier: account.email,
                    password: account.password,
                  })
                }
                style={({pressed}) => [
                  styles.seedAccount,
                  pressed && styles.pressed,
                  busy && styles.disabled,
                ]}>
                <View style={styles.seedAvatar}>
                  <AppText weight="900" size={13} color="#fff">
                    {account.name.charAt(0)}
                  </AppText>
                </View>
                <View style={styles.seedAccountCopy}>
                  <AppText weight="800" size={11.5} color={colors.navy}>
                    Continue as {account.name}
                  </AppText>
                  <AppText size={9} color={colors.primary} numberOfLines={1}>
                    {account.email}
                  </AppText>
                  <AppText size={9} color={colors.text2}>
                    {account.description}
                  </AppText>
                </View>
                <Icon name="chev" size={14} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          style={styles.centerLink}>
          <AppText weight="600" size={10.5} color="#757575" style={styles.accountText}>New to RACI? </AppText>
          <AppText weight="800" size={10.5} color={colors.primary} style={styles.accountText}>Create an account</AppText>
        </Pressable>

        <Pressable onPress={() => enterGuest()} accessibilityRole="button" style={styles.centerLink}>
          <AppText weight="600" size={9} color="#9E9E9E">or </AppText>
          <AppText weight="600" size={9} color={colors.primary}>browse as guest</AppText>
        </Pressable>

        <View style={styles.dots} accessibilityElementsHidden>
          <View style={styles.dotOn} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </ScrollView>
    </Screen>
  );
}
