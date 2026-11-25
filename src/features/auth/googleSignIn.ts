import {NativeModules} from 'react-native';

type NativeGoogleAuth = {
  signIn: () => Promise<{idToken?: string; email?: string; name?: string}>;
  signOut?: () => Promise<void>;
};

const native = NativeModules.RaciGoogleAuth as NativeGoogleAuth | undefined;

export type GoogleAccount = {
  idToken: string;
  email?: string;
  name?: string;
};

export class GoogleSignInError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'GoogleSignInError';
  }
}

const GOOGLE_AUTH_COPY: Record<string, string> = {
  GOOGLE_AUTH_NOT_CONFIGURED: 'Google sign-in is unavailable right now. Continue with email, or try again later.',
  GOOGLE_TOKEN_INVALID: 'Google sign-in expired. Try again.',
  GOOGLE_PROFILE_INCOMPLETE: 'That Google account has no email. Choose an account that includes an email address.',
  GOOGLE_EMAIL_UNVERIFIED: 'Verify that email with Google, then try again.',
  UNAUTHORIZED: 'This account cannot sign in. Contact the institute if you think this is a mistake.',
  google_not_configured: 'Google sign-in is not connected in this build. Continue with email.',
  google_unavailable: 'Google sign-in is not available on this device. Continue with email.',
  google_token_missing: 'Google did not return a sign-in token. Try again.',
  google_failed: 'Google sign-in could not be completed. Continue with email.',
};

export function googleSignInAvailable(): boolean {
  return Boolean(native?.signIn);
}

/** Null means the learner cancelled and the UI should stay quiet. */
export function messageForGoogleAuth(error: unknown): string | null {
  if (error instanceof GoogleSignInError && error.code === 'google_cancelled') return null;
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === 'google_cancelled') return null;
  if (code && GOOGLE_AUTH_COPY[code]) return GOOGLE_AUTH_COPY[code];
  if (error instanceof GoogleSignInError) return error.message;
  if (error && typeof error === 'object' && 'message' in error && error.message) return String(error.message);
  return 'Google sign-in could not be completed.';
}

export async function signOutGoogle(): Promise<void> {
  if (!native?.signOut) return;
  try {
    await native.signOut();
  } catch {
    // The REDI session is already discarded. Google account cleanup is optional.
  }
}

export async function signInWithGoogle(): Promise<GoogleAccount> {
  if (!native?.signIn) {
    throw new GoogleSignInError(
      'google_unavailable',
      'Google sign-in is not available on this device. Continue with email.',
    );
  }
  try {
    const account = await native.signIn();
    const idToken = account.idToken?.trim();
    if (!idToken) {
      throw new GoogleSignInError('google_token_missing', 'Google did not return a sign-in token.');
    }
    return {idToken, email: account.email, name: account.name};
  } catch (error) {
    if (error instanceof GoogleSignInError) throw error;
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'google_failed';
    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Google sign-in could not be completed.';
    throw new GoogleSignInError(code, message);
  }
}
