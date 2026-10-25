import {create} from 'zustand';
import type {ContentRef, LearnerProfile, SessionStatus, SessionTokens} from './types';
import {bumpSessionGeneration, currentSessionGeneration, onSessionRevoked, persistTokens, hydrateTokens, wipeTokens} from './api/http';
import {queryClient} from './query';
import {clearAccountStorage, getPreference, setPreference} from './storage';
import {offlineFiles} from './offlineFiles';
import {runStartupMigrations} from './migrations';

async function clearSessionCache() {
  await queryClient.cancelQueries();
  // Catalogue/detail responses also carry personalized access and signed URLs.
  queryClient.clear();
}

type SessionState = {
  status: SessionStatus;
  tokens: SessionTokens | null;
  profile: LearnerProfile | null;
  pendingDestination: ContentRef | null;
  hydrate: () => Promise<void>;
  setAuthenticated: (tokens: SessionTokens, profile: LearnerProfile) => Promise<void>;
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
  pendingDestination: null,
  hydrate: async () => {
    const generation = currentSessionGeneration();
    set({status: 'bootstrapping', tokens: null, profile: null});
    try {
      await runStartupMigrations();
      if (generation !== currentSessionGeneration()) return;
      const tokens = await hydrateTokens();
      if (generation !== currentSessionGeneration()) return;
      if (!tokens) {
        const guest = await getPreference('guestMode', false);
        if (generation !== currentSessionGeneration()) return;
        set({status: guest ? 'guest' : 'loggedOut', tokens: null, profile: null});
        return;
      }
      try {
        const {repositories} = await import('./di');
        const profile = await repositories.auth.me();
        if (generation === currentSessionGeneration()) {
          set({status: 'authenticated', tokens, profile});
          reportAppVersion();
        }
      } catch (error) {
        if (generation !== currentSessionGeneration()) return;
        if ((error as {httpStatus?: number}).httpStatus === 401) {
          await get().logout();
        } else {
          set({status: 'recoveryRequired', tokens});
        }
      }
    } catch {
      if (generation === currentSessionGeneration()) set({status: 'recoveryRequired', tokens: null, profile: null});
    }
  },
  setAuthenticated: async (tokens, profile) => {
    const generation = bumpSessionGeneration();
    await clearSessionCache();
    if (generation !== currentSessionGeneration()) return;
    await persistTokens(tokens);
    await setPreference('guestMode', false);
    if (generation !== currentSessionGeneration()) return;
    set({status: 'authenticated', tokens, profile, pendingDestination: get().pendingDestination});
    reportAppVersion();
  },
  enterGuest: async () => {
    await wipeTokens();
    await setPreference('guestMode', true);
    await clearSessionCache();
    set({status: 'guest', tokens: null, profile: null});
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
        // Device cleanup is local. The learner API has no device-token route.
      }
    }
    bumpSessionGeneration();
    set({status: 'loggedOut', tokens: null, profile: null, pendingDestination: null});
    await clearSessionCache();
    await wipeTokens();
    await setPreference('guestMode', false);
    if (accountId) {
      await offlineFiles.clear(accountId);
      await clearAccountStorage(accountId);
    }
  },
  setPendingDestination: ref => set({pendingDestination: ref}),
  setProfile: profile => set({profile}),
  showLogin: () => set({status: 'loggedOut'}),
}));

onSessionRevoked(() => {
  useSessionStore.setState({status: 'loggedOut', tokens: null, profile: null, pendingDestination: null});
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
