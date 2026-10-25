import React, {useEffect} from 'react';
import {View} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSessionStore} from '../core/session';
import {themedScreen, useTheme} from '../theme/ThemeProvider';
import type {RootStackParamList} from './types';
import {TabNavigator} from './TabNavigator';
import {
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  VerifyContactScreen,
  ResetPasswordScreen,
} from '../screens/auth';
import {DailyQuizScreen, TestRunnerScreen} from '../screens/assessments';
import {CheckoutScreen, PaymentSuccessScreen, PaymentFailureScreen, PaymentPendingScreen} from '../screens/payments';
import {SemesterWaitScreen} from '../screens/semesters';
import {AppText, ClayButton, LoadingBlock} from '../components/ui';
import {LegalScreen} from '../screens/support';
import {SplashScreen} from '../screens/splash/SplashScreen';
import {OnboardingScreen} from '../screens/onboarding';
import {usePreferencesStore} from '../features/settings/preferencesStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
export function RootNavigator() {
  const status = useSessionStore(s => s.status);
  const hydrate = useSessionStore(s => s.hydrate);
  const [showSplash, setShowSplash] = React.useState(true);
  const preferencesHydrated = usePreferencesStore(state => state.hydrated);
  const onboardingComplete = usePreferencesStore(state => state.onboardingComplete);
  const theme = useTheme();
  const screenOptions = React.useMemo(
    () => ({
      headerShown: false as const,
      freezeOnBlur: true,
      statusBarStyle: theme.scheme === 'dark' ? 'light' as const : 'dark' as const,
      statusBarBackgroundColor: theme.scheme === 'dark' ? theme.colors.scroll : '#FFFFFF',
      navigationBarColor: theme.colors.white,
    }),
    [theme.colors.scroll, theme.colors.white, theme.scheme],
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const navTheme = {
    ...DefaultTheme,
    dark: theme.scheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.scheme === 'dark' ? theme.colors.scroll : '#FFFFFF',
      card: theme.colors.white,
      text: theme.colors.ink,
      border: theme.colors.progressTrack,
      notification: theme.colors.error,
    },
  };

  if (showSplash) {
    return <SplashScreen ready={status !== 'bootstrapping'} onFinish={() => setShowSplash(false)} />;
  }

  if (!preferencesHydrated) {
    return <View style={{flex: 1, justifyContent: 'center', backgroundColor: theme.colors.scroll}}><LoadingBlock /></View>;
  }

  const inApp = status === 'authenticated' || status === 'guest';

  if (status === 'recoveryRequired') {
    return <View style={{flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: theme.colors.scroll}}>
      <AppText weight="800" size={20}>Reconnect to continue</AppText>
      <AppText>We could not restore your account. Your sign-in details are still saved securely.</AppText>
      <ClayButton label="Try again" onPress={() => void hydrate()} />
      <ClayButton label="Sign out" tone="ghost" onPress={() => void useSessionStore.getState().logout()} />
    </View>;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={screenOptions} initialRouteName={inApp ? 'Main' : onboardingComplete ? 'Login' : 'Onboarding'}>
        {inApp ? (
          <Stack.Group navigationKey={status}>
            <Stack.Screen name="Main" component={themedScreen(TabNavigator)} />
            {status === 'authenticated' ? <Stack.Group>
            <Stack.Screen name="DailyQuiz" component={themedScreen(DailyQuizScreen)} />
            <Stack.Screen name="TestRunner" component={themedScreen(TestRunnerScreen)} />
            <Stack.Screen name="Checkout" component={themedScreen(CheckoutScreen)} />
            <Stack.Screen name="PaymentSuccess" component={themedScreen(PaymentSuccessScreen)} />
            <Stack.Screen name="PaymentFailure" component={themedScreen(PaymentFailureScreen)} />
            <Stack.Screen name="PaymentPending" component={themedScreen(PaymentPendingScreen)} />
            <Stack.Screen name="SemesterWait" component={themedScreen(SemesterWaitScreen)} />
            </Stack.Group> : null}
          </Stack.Group>
        ) : (
          <Stack.Group navigationKey="auth">
            <Stack.Screen name="Onboarding" component={themedScreen(OnboardingScreen)} />
            <Stack.Screen name="Login" component={themedScreen(LoginScreen)} />
            <Stack.Screen name="Register" component={themedScreen(RegisterScreen)} />
            <Stack.Screen name="ForgotPassword" component={themedScreen(ForgotPasswordScreen)} />
            <Stack.Screen name="VerifyContact" component={themedScreen(VerifyContactScreen)} />
            <Stack.Screen name="ResetPassword" component={themedScreen(ResetPasswordScreen)} />
          </Stack.Group>
        )}
        <Stack.Screen name="PublicLegal" component={themedScreen(LegalScreen)} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
