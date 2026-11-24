import React from 'react';
import {Alert} from 'react-native';
import {useRepositories} from '../../../core/di';
import {useSessionStore} from '../../../core/session';
import type {LearnerAddress} from '../../../core/types';
import {messageForGoogleAuth, signInWithGoogle} from '../googleSignIn';

export function useGoogleAccount() {
  const repos = useRepositories();
  const setAuthenticated = useSessionStore(s => s.setAuthenticated);
  const [busy, setBusy] = React.useState(false);
  const lock = React.useRef(false);

  const signInWithGoogleAccount = React.useCallback(async (address?: LearnerAddress) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const account = await signInWithGoogle();
      const result = await repos.auth.exchangeGoogle(account.idToken, address);
      await setAuthenticated(result.tokens, result.profile, {addressPrompt: result.isNewUser});
    } catch (error) {
      const message = messageForGoogleAuth(error);
      if (message) Alert.alert('Could not continue with Google', message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [repos.auth, setAuthenticated]);

  return {busy, signInWithGoogleAccount};
}
