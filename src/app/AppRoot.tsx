import React, {Component, type ErrorInfo, type ReactNode} from 'react';
import {View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClientProvider} from '@tanstack/react-query';
import {enableFreeze, enableScreens} from 'react-native-screens';
import {queryClient, bindAppStateFocus} from '../core/query';
import {RepositoryContext, repositories} from '../core/di';
import {RootNavigator} from '../navigation/RootNavigator';
import {AppDialogHost, AppText, ClayButton, RefreshIndicatorHost} from '../components/ui';
import {colors} from '../theme';
import {ThemeProvider, useTheme} from '../theme/ThemeProvider';
import {usePreferencesStore} from '../features/settings/preferencesStore';
import {bindLearningReminders, syncLearningReminder} from '../features/settings/reminders';
import '../features/settings/i18n';
import {NotificationRuntime} from '../features/notifications';

enableScreens();
enableFreeze(true);

class ErrorBoundary extends Component<{children: ReactNode}, {error?: Error}> {
  state: {error?: Error} = {};
  static getDerivedStateFromError(error: Error) {
    return {error};
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error('[RACI] ErrorBoundary', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.scroll}}>
          <AppText weight="900" size={20} color={colors.navy}>Something went wrong</AppText>
          <AppText color={colors.text2}>Please try again. If this keeps happening, close and reopen RACI.</AppText>
          <ClayButton label="Try again" onPress={() => this.setState({error: undefined})} />
        </View>
      );
    }
    return this.props.children;
  }
}

export function AppRoot() {
  React.useEffect(() => {
    const unbindFocus = bindAppStateFocus();
    return () => {
      unbindFocus();
    };
  }, []);
  return (
    <ThemeProvider>
      <AppFrame />
    </ThemeProvider>
  );
}

function AppFrame() {
  const theme = useTheme();
  return (
    <GestureHandlerRootView
      style={{flex: 1, backgroundColor: theme.scheme === 'dark' ? theme.colors.scroll : '#FFFFFF'}}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RepositoryContext.Provider value={repositories}>
              <ErrorBoundary>
                <PreferencesRuntime />
                <NotificationRuntime />
                <ThemedShell>
                  <RootNavigator />
                </ThemedShell>
                <RefreshIndicatorHost />
              </ErrorBoundary>
              <AppDialogHost />
          </RepositoryContext.Provider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function PreferencesRuntime() {
  React.useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    const unbindFallback = bindLearningReminders();
    void usePreferencesStore.getState().hydrate().then(() => {
      if (disposed) return;
      void syncLearningReminder();
      unsubscribe = usePreferencesStore.subscribe((state, previous) => {
        if (
          state.reminderEnabled !== previous.reminderEnabled ||
          state.reminderHour !== previous.reminderHour ||
          state.reminderMinute !== previous.reminderMinute ||
          state.language !== previous.language
        ) {
          void syncLearningReminder();
        }
      });
    });
    return () => {
      disposed = true;
      unsubscribe?.();
      unbindFallback();
    };
  }, []);
  return null;
}

function ThemedShell({children}: {children: ReactNode}) {
  const theme = useTheme();
  return (
    <View style={{flex: 1, backgroundColor: theme.scheme === 'dark' ? theme.colors.scroll : '#FFFFFF'}}>
      {children}
    </View>
  );
}
