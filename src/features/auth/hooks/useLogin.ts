import React from 'react';
import {Alert} from 'react-native';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useRepositories} from '../../../core/di';
import {useSessionStore} from '../../../core/session';
import {loginSchema, type LoginFormValues} from '../schema';

export function useLogin() {
  const repos = useRepositories();
  const setAuthenticated = useSessionStore(s => s.setAuthenticated);
  const enterGuest = useSessionStore(s => s.enterGuest);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {identifier: '', password: ''},
  });
  const [busy, setBusy] = React.useState(false);
  const lock = React.useRef(false);

  const signIn = React.useCallback(async (values: LoginFormValues) => {
    if (lock.current) return;
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
  }, [repos.auth, setAuthenticated]);

  const onSubmit = form.handleSubmit(signIn);

  const loginWithSeedAccount = React.useCallback(
    (values: LoginFormValues) => {
      form.reset(values);
      void signIn(values);
    },
    [form, signIn],
  );

  return {
    form,
    busy,
    onSubmit,
    loginWithSeedAccount,
    enterGuest,
  };
}
