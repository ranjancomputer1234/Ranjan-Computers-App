import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import type {SessionTokens} from './types';

const TOKEN_SERVICE = 'com.rediapp.learner.session';
const PREFS_PREFIX = 'redi.prefs.';

export async function saveSessionTokens(tokens: SessionTokens): Promise<void> {
  const saved = await Keychain.setGenericPassword(tokens.accountId, JSON.stringify(tokens), {
      service: TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!saved) throw new Error('Secure storage is unavailable. Please try signing in again.');
}

export async function readSessionTokens(): Promise<SessionTokens | null> {
    const result = await Keychain.getGenericPassword({service: TOKEN_SERVICE});
    if (!result) {
      return null;
    }
  try {
    const tokens = JSON.parse(result.password) as SessionTokens;
    return tokens.accountId && tokens.accessToken && Number.isFinite(Date.parse(tokens.expiresAt)) ? tokens : null;
  } catch {
    throw new Error('Your saved sign-in could not be read. Please retry or sign out.');
  }
}

export async function clearSessionTokens(): Promise<void> {
  await Keychain.resetGenericPassword({service: TOKEN_SERVICE});
}

export async function clearAccountStorage(accountId: string): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(`${PREFS_PREFIX}${accountId}.`));
  await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
}

export async function getPreference<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_PREFIX + key);
    if (raw == null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setPreference<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_PREFIX + key, JSON.stringify(value));
  } catch {
    // Preferences are best-effort on flaky storage.
  }
}

export async function removePreference(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFS_PREFIX + key);
  } catch {
    // ignore
  }
}

export async function getAccountScoped<T>(
  accountId: string,
  key: string,
  fallback: T,
): Promise<T> {
  return getPreference(`${accountId}.${key}`, fallback);
}

export async function setAccountScoped<T>(accountId: string, key: string, value: T): Promise<void> {
  await setPreference(`${accountId}.${key}`, value);
}
