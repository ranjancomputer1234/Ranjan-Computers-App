import React from 'react';
import {Pressable, ScrollView, TextInput, View, type TextInputProps} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RediLogo} from '../../assets/illustrations';
import {Icon, type IconName} from '../../assets/icons';
import {AppText} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {Screen} from '../../components/layout/Screen';
import {useRepositories} from '../../core/di';
import {useAsyncAction} from '../../core/useAsyncAction';
import {useSessionStore} from '../../core/session';
import type {RootStackParamList} from '../../navigation/types';
import {colors, gradients} from '../../theme';
import {styles} from './styles';
import {useUiTranslation} from '../../features/settings/uiTranslations';

type FieldName = 'firstName' | 'lastName' | 'email' | 'phone' | 'city' | 'password' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;

type SignupFieldProps = TextInputProps & {
  label: string;
  icon: IconName;
  error?: string;
  secure?: boolean;
};

function SignupField({label, icon, error, secure, ...inputProps}: SignupFieldProps) {
  const [hidden, setHidden] = React.useState(Boolean(secure));
  const tx = useUiTranslation();

  return (
    <View style={styles.signupField}>
      <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
        {label}
      </AppText>
      <View style={[styles.signupInputSurface, error ? styles.signupInputError : null]}>
        <Icon name={icon} size={18} color={error ? colors.error : colors.text3} />
        <TextInput
          {...inputProps}
          accessibilityLabel={tx(label)}
          placeholder={inputProps.placeholder ? tx(inputProps.placeholder) : undefined}
          placeholderTextColor={colors.text3}
          secureTextEntry={secure ? hidden : false}
          style={styles.signupTextInput}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden(value => !value)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={tx(hidden ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`)}>
            <Icon name="eye" size={18} color={colors.text3} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText accessibilityRole="alert" size={12} color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const repos = useRepositories();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [city, setCity] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (firstName.trim().length < 1) nextErrors.firstName = 'Enter your first name.';
    if (lastName.trim().length < 1) nextErrors.lastName = 'Enter your last name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) nextErrors.phone = 'Enter a valid 10-digit mobile number.';
    if (!city.trim()) nextErrors.city = 'Enter your city.';
    else if (city.trim().length > 100) nextErrors.city = 'City must be 100 characters or fewer.';
    if (password.length < 6) nextErrors.password = 'Use at least 6 characters.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
    else if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.';
    return nextErrors;
  };

  const clearError = (field: FieldName) => {
    setErrors(current => (current[field] ? {...current, [field]: undefined} : current));
  };

  const register = useAsyncAction(async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await repos.auth.register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || undefined,
      city: city.trim(),
      password,
    });
    await useSessionStore.getState().setAuthenticated(result.tokens, result.profile);
  });

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.loginScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.loginPage}>
        <View style={styles.loginStage}>
        <Gradient colors={gradients.loginHero} start={{x: 0.08, y: 0}} end={{x: 0.92, y: 1}} style={styles.loginBrand}>
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
            <AppText weight="800" size={22} color={colors.navy} center style={styles.welcome}>Create your account</AppText>
            <AppText weight="500" size={14} color={colors.text2} center>Join RACI and begin your learning journey.</AppText>
          </View>

          <SignupField
            label="First name"
            icon="user"
            value={firstName}
            onChangeText={value => {
              setFirstName(value);
              clearError('firstName');
            }}
            placeholder="e.g. Riya"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="name-given"
            textContentType="givenName"
            returnKeyType="next"
            error={errors.firstName}
          />

          <SignupField
            label="Last name"
            icon="user"
            value={lastName}
            onChangeText={value => {
              setLastName(value);
              clearError('lastName');
            }}
            placeholder="e.g. Sharma"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="name-family"
            textContentType="familyName"
            returnKeyType="next"
            error={errors.lastName}
          />

          <SignupField
            label="Email address"
            icon="send"
            value={email}
            onChangeText={value => {
              setEmail(value);
              clearError('email');
            }}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            error={errors.email}
          />

          <SignupField
            label="Mobile number (optional)"
            icon="chat"
            value={phone}
            onChangeText={value => {
              setPhone(value.replace(/\D/g, '').slice(0, 10));
              clearError('phone');
            }}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={10}
            error={errors.phone}
          />

          <SignupField
            label="City"
            icon="pin"
            value={city}
            onChangeText={value => {
              setCity(value);
              clearError('city');
            }}
            placeholder="Your city"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            error={errors.city}
          />

          <SignupField
            label="Create password"
            icon="lock"
            value={password}
            onChangeText={value => {
              setPassword(value);
              clearError('password');
              clearError('confirmPassword');
            }}
            placeholder="Minimum 6 characters"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            secure
            error={errors.password}
          />

          <SignupField
            label="Confirm password"
            icon="shield"
            value={confirmPassword}
            onChangeText={value => {
              setConfirmPassword(value);
              clearError('confirmPassword');
            }}
            placeholder="Re-enter your password"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            secure
            error={errors.confirmPassword}
          />

          {register.error ? (
            <View style={styles.signupApiError}>
              <Icon name="shield" size={16} color={colors.error} />
              <AppText accessibilityRole="alert" size={13} color={colors.error} style={styles.signupApiErrorText}>
                {register.error}
              </AppText>
            </View>
          ) : null}

          <Pressable
            onPress={() => register.run()}
            disabled={register.busy}
            accessibilityRole="button"
            accessibilityState={{disabled: register.busy}}
            style={({pressed}) => [styles.loginPressable, pressed && styles.pressed, register.busy && styles.disabled]}>
            <Gradient colors={gradients.primaryButton} style={styles.loginButton}>
              <AppText weight="700" size={16} color="#fff" center>
                {register.busy ? 'Creating your account…' : 'Create account'}
              </AppText>
            </Gradient>
          </Pressable>
        </View>

        <View style={styles.loginFooter}>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            style={styles.loginLink}>
            <AppText weight="500" size={14} color={colors.text2}>Already have an account? </AppText>
            <AppText weight="700" size={14} color={colors.primary}>Sign in</AppText>
          </Pressable>

          <View style={styles.signupTrustRow}>
            <Icon name="shield" size={14} color={colors.success} />
            <AppText weight="500" size={12} color={colors.text3}>Your details are private and secure</AppText>
          </View>
        </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
