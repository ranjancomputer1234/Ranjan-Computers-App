import {NativeModules, Platform} from 'react-native';

export type AppConfig = {
  apiBaseUrl: string;
  apiVersion: string;
  requestTimeoutMs: number;
  seedAccounts: Array<{name: string; email: string; password: string; description: string}>;
  privacyPolicyUrl?: string;
  accountDeletionUrl?: string;
  versionName: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  speechRecognitionEnabled: boolean;
  pushProvider: 'none' | 'fcm' | 'apns';
  videoProvider: 'native' | 'external';
  liveProvider: 'native' | 'external';
  paymentRoute: 'play_billing' | 'app_store';
  capabilities: {
    googleLogin: boolean;
    liveChat: boolean;
    downloads: boolean;
    payments: boolean;
    speechSearch: boolean;
  };
};

const native = NativeModules.RediBuildConfig ?? {};

/** Learner API. Paths in the handover are relative to this `/api` prefix. */
export const PRODUCTION_API_BASE_URL = 'https://redi-api-production.up.railway.app/api';

function isLocalApiHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2' || host === '10.0.3.2';
}

function resolveApiBaseUrl(configured?: string): string {
  const value = (configured ?? '').trim().replace(/\/+$/, '');
  if (!value) return PRODUCTION_API_BASE_URL;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!url.protocol.startsWith('http')) return PRODUCTION_API_BASE_URL;
    // The debug app can still be compiled with the emulator loopback. Those seed
    // accounts live on the production API, and no local server is required for them.
    if (isLocalApiHost(host)) return PRODUCTION_API_BASE_URL;
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}${url.search}`.replace(/\/+$/, '');
  } catch {
    return PRODUCTION_API_BASE_URL;
  }
}

function seedAccounts(nativeConfig: Record<string, string | undefined>) {
  const rows = [
    {
      name: 'Riya',
      email: nativeConfig.seedRiyaEmail,
      password: nativeConfig.seedRiyaPassword,
      description: 'Enrolled in Tally Prime Basics, with an admit card and a course entitlement',
    },
    {
      name: 'Arjun',
      email: nativeConfig.seedArjunEmail,
      password: nativeConfig.seedArjunPassword,
      description: 'Active learner without a seeded entitlement',
    },
  ];
  return rows.filter(
    (row): row is {name: string; email: string; password: string; description: string} =>
      Boolean(row.email && row.password),
  );
}

export const appConfig: AppConfig = {
  apiBaseUrl: resolveApiBaseUrl(native.apiBaseUrl),
  apiVersion: 'v1',
  requestTimeoutMs: Number(native.timeoutMs) > 0 ? Number(native.timeoutMs) : 15000,
  seedAccounts: __DEV__ ? seedAccounts(native) : [],
  privacyPolicyUrl: native.privacyPolicyUrl || undefined,
  accountDeletionUrl: native.accountDeletionUrl || undefined,
  versionName: native.versionName || '1.0.0',
  googleWebClientId: native.googleWebClientId || undefined,
  speechRecognitionEnabled: false,
  pushProvider: Platform.OS === 'android' && native.firebaseEnabled ? 'fcm' : 'none',
  videoProvider: 'native',
  liveProvider: 'native',
  paymentRoute: Platform.OS === 'android' ? 'play_billing' : 'app_store',
  capabilities: {
    googleLogin: false,
    // Live chat is intentionally disabled in every data mode. Keep this as a
    // capability flag so the UI and network layer cannot activate it from a
    // backend join response alone.
    liveChat: false,
    downloads: true,
    payments: false,
    speechSearch: false,
  },
};
