import {create} from 'zustand';
import type {ContentRef, LearnerProfile, SessionStatus, SessionTokens} from './types';
import {bumpSessionGeneration, currentSessionGeneration, onSessionRevoked, persistTokens, hydrateTokens, toAppError, wipeTokens} from './api/http';
import {queryClient} from './query';
import {hasLearnerAddress} from '../features/location/address';
import {signOutGoogle} from '../features/auth/googleSignIn';
import {clearAccountStorage, getAccountScoped, getPreference, setAccountScoped, setPreference} from './storage';
import {offlineFiles} from './offlineFiles';
import {runStartupMigrations} from './migrations';

async function clearSessionCache() {
  await queryClient.cancelQueries();
  // Catalogue/detail responses also carry personalized access and signed URLs.
  queryClient.clear();
}

function recoveryNoteFor(error: unknown): string {
  const appError = toAppError(error);
  if (appError.retryable || !appError.httpStatus) {
    return 'Check your internet connection, then try again.';
  }
  return 'The server could not confirm your account. You can try again in a moment.';
}

type SessionState = {
  status: SessionStatus;
  tokens: SessionTokens | null;
  profile: LearnerProfile | null;
  recoveryNote: string | null;
  pendingDestination: ContentRef | null;
  addressPrompt: boolean;
  hydrate: () => Promise<void>;
  setAuthenticated: (tokens: SessionTokens, profile: LearnerProfile, options?: {addressPrompt?: boolean}) => Promise<void>;
  dismissAddressPrompt: () => Promise<void>;
  enterGuest: () => Promise<void>;
  logout: () => Promise<void>;
  setPendingDestination: (ref: ContentRef | null) => void;
  setProfile: (profile: LearnerProfile) => void;
  showLogin: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'bootstrapping',
  tokens: null,
  profile: null,
  recoveryNote: null,
  pendingDestination: null,
  addressPrompt: false,
  hydrate: async () => {
    const generation = currentSessionGeneration();
    const retrying = get().status === 'recoveryRequired';
    if (!retrying) {
      set({status: 'bootstrapping', tokens: null, profile: null, recoveryNote: null});
    }
    try {
      await runStartupMigrations();
      if (generation !== currentSessionGeneration()) return;
      const tokens = await hydrateTokens();
      if (generation !== currentSessionGeneration()) return;
      if (!tokens) {
        const guest = await getPreference('guestMode', false);
        if (generation !== currentSessionGeneration()) return;
        set({status: guest ? 'guest' : 'loggedOut', tokens: null, profile: null, recoveryNote: null, addressPrompt: false});
        return;
      }
      try {
        const {repositories} = await import('./di');
        const profile = await repositories.auth.me();
        if (generation === currentSessionGeneration()) {
          const prompt = await getAccountScoped(tokens.accountId, 'addressPrompt', false);
          set({
            status: 'authenticated',
            tokens,
            profile,
            recoveryNote: null,
            addressPrompt: prompt && !hasLearnerAddress(profile),
          });
          reportAppVersion();
        }
      } catch (error) {
        if (generation !== currentSessionGeneration()) return;
        if ((error as {httpStatus?: number}).httpStatus === 401) {
          await get().logout();
        } else {
          set({status: 'recoveryRequired', tokens, recoveryNote: recoveryNoteFor(error)});
        }
      }
    } catch {
      if (generation === currentSessionGeneration()) {
        set({
          status: 'recoveryRequired',
          tokens: null,
          profile: null,
          recoveryNote: 'We could not read the saved sign-in on this device.',
        });
      }
    }
  },
  setAuthenticated: async (tokens, profile, options) => {
    const generation = bumpSessionGeneration();
    await clearSessionCache();
    if (generation !== currentSessionGeneration()) return;
    await persistTokens(tokens);
    await setPreference('guestMode', false);
    const addressPrompt = Boolean(options?.addressPrompt) && !hasLearnerAddress(profile);
    await setAccountScoped(tokens.accountId, 'addressPrompt', addressPrompt);
    if (generation !== currentSessionGeneration()) return;
    set({
      status: 'authenticated',
      tokens,
      profile,
      recoveryNote: null,
      pendingDestination: get().pendingDestination,
      addressPrompt,
    });
    reportAppVersion();
  },
  dismissAddressPrompt: async () => {
    const accountId = get().tokens?.accountId;
    if (accountId) await setAccountScoped(accountId, 'addressPrompt', false);
    set({addressPrompt: false});
  },
  enterGuest: async () => {
    await wipeTokens();
    await setPreference('guestMode', true);
    await clearSessionCache();
    set({status: 'guest', tokens: null, profile: null, recoveryNote: null, addressPrompt: false});
  },
  logout: async () => {
    const accountId = get().tokens?.accountId;
    try {
      const {repositories} = await import('./di');
      await repositories.auth.logout();
    } catch {
      // The token is still discarded on this device.
    }
    if (accountId) {
      try {
        const {unregisterPushDevice} = await import('../features/notifications/pushNotifications');
        const {repositories} = await import('./di');
        await unregisterPushDevice(repositories.account);
      } catch {
        // The session is still discarded on this device when the device call fails.
      }
    }
    bumpSessionGeneration();
    await signOutGoogle();
    await wipeTokens();
    set({status: 'loggedOut', tokens: null, profile: null, recoveryNote: null, pendingDestination: null, addressPrompt: false});
    await clearSessionCache();
    await setPreference('guestMode', false);
    if (accountId) {
      await offlineFiles.clear(accountId);
      await clearAccountStorage(accountId);
    }
  },
  setPendingDestination: ref => set({pendingDestination: ref}),
  setProfile: profile => set({profile}),
  showLogin: () => set({status: 'loggedOut', recoveryNote: null}),
}));

onSessionRevoked(() => {
  useSessionStore.setState({status: 'loggedOut', tokens: null, profile: null, recoveryNote: null, pendingDestination: null, addressPrompt: false});
  void clearSessionCache();
});

function reportAppVersion() {
  void import('./di').then(async ({repositories}) => {
    try {
      const profile = await repositories.auth.updateMe({});
      if (useSessionStore.getState().status === 'authenticated') {
        useSessionStore.setState({profile});
      }
    } catch {
      // The installed build is reported for staff. A failed patch must not end the session.
    }
  });
}

export function accountKey(): string {
  return useSessionStore.getState().tokens?.accountId ?? 'guest';
}

export function isAuthenticated(): boolean {
  return useSessionStore.getState().status === 'authenticated';
}
