import React from 'react';
import {Alert} from 'react-native';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useRepositories} from '../../../core/di';
import {useSessionStore} from '../../../core/session';
import {loginSchema, type LoginFormValues} from '../schema';
import {useGoogleAccount} from './useGoogleAccount';

export function useLogin() {
  const repos = useRepositories();
  const setAuthenticated = useSessionStore(s => s.setAuthenticated);
  const enterGuest = useSessionStore(s => s.enterGuest);
  const google = useGoogleAccount();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {identifier: '', password: ''},
  });
  const [busy, setBusy] = React.useState(false);
  const lock = React.useRef(false);

  const signIn = React.useCallback(async (values: LoginFormValues) => {
    if (lock.current || google.busy) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await repos.auth.login(values.identifier, values.password);
      await setAuthenticated(result.tokens, result.profile);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Login failed';
      Alert.alert('Could not sign in', message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [google.busy, repos.auth, setAuthenticated]);

  const onSubmit = form.handleSubmit(signIn);

  const signInWithGoogleAccount = React.useCallback(async () => {
    if (lock.current || busy) return;
    lock.current = true;
    try {
      await google.signInWithGoogleAccount();
    } finally {
      lock.current = false;
    }
  }, [busy, google]);

  return {
    form,
    busy: busy || google.busy,
    onSubmit,
    signInWithGoogleAccount,
    enterGuest,
  };
}
