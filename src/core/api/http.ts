import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import {appConfig} from '../config';
import type {AppError, SessionTokens} from '../types';
import {
  clearSessionTokens,
  readSessionTokens,
  saveSessionTokens,
} from '../storage';

type TokenProvider = {
  getAccessToken: () => string | null;
  getAccountId: () => string | null;
  setTokens: (tokens: SessionTokens) => void;
  onSessionRevoked: () => void;
  generation: () => number;
};

type RequestConfig = InternalAxiosRequestConfig & {
  sessionGeneration?: number;
  learnerAuthenticated?: boolean;
  /** Confirms a 401 without treating that confirmation itself as a signed-out session. */
  sessionProbe?: boolean;
};

type ApiErrorBody = {
  code?: string;
  message?: string | string[];
  requestId?: string;
  fieldErrors?: Record<string, string | string[]>;
};

let memoryTokens: SessionTokens | null = null;
let sessionGeneration = 0;
let storageTask = Promise.resolve();
const revocationListeners = new Set<() => void>();

export function onSessionRevoked(listener: () => void): () => void {
  revocationListeners.add(listener);
  return () => {
    revocationListeners.delete(listener);
  };
}

export const tokenStore: TokenProvider = {
  getAccessToken: () => memoryTokens?.accessToken ?? null,
  getAccountId: () => memoryTokens?.accountId ?? null,
  setTokens: tokens => {
    memoryTokens = tokens;
  },
  onSessionRevoked: () => {
    memoryTokens = null;
    sessionGeneration += 1;
    revocationListeners.forEach(listener => listener());
  },
  generation: () => sessionGeneration,
};

export function bumpSessionGeneration(): number {
  sessionGeneration += 1;
  memoryTokens = null;
  return sessionGeneration;
}

export function currentSessionGeneration(): number {
  return sessionGeneration;
}

export async function hydrateTokens(): Promise<SessionTokens | null> {
  const generation = sessionGeneration;
  const stored = await readSessionTokens();
  if (generation !== sessionGeneration) return null;
  memoryTokens = stored;
  return stored;
}

export async function persistTokens(tokens: SessionTokens): Promise<void> {
  const generation = sessionGeneration;
  const write = storageTask.catch(() => {}).then(async () => {
    if (generation !== sessionGeneration) return;
    await saveSessionTokens(tokens);
    if (generation === sessionGeneration) memoryTokens = tokens;
  });
  storageTask = write;
  await write;
}

export async function wipeTokens(): Promise<void> {
  memoryTokens = null;
  sessionGeneration += 1;
  const wipe = storageTask.catch(() => {}).then(clearSessionTokens);
  storageTask = wipe;
  await wipe;
}

function normalizeFieldErrors(
  fieldErrors?: Record<string, string | string[]>,
): Record<string, string[]> | undefined {
  if (!fieldErrors) return undefined;
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, value]) => [
      field,
      Array.isArray(value) ? value.map(String) : [String(value)],
    ]),
  );
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<ApiErrorBody>;
    const status = ax.response?.status;
    const data = ax.response?.data;
    const retryable =
      !status || status >= 500 || ax.code === 'ECONNABORTED' || !ax.response;
    const serverMessage = Array.isArray(data?.message)
      ? data.message.join('\n')
      : data?.message;
    return {
      code: data?.code ?? ax.code ?? (status === 400 ? 'validation_error' : 'network_error'),
      message:
        serverMessage ??
        (retryable ? 'Connection problem. Please retry.' : 'Request failed.'),
      httpStatus: status,
      fieldErrors: normalizeFieldErrors(data?.fieldErrors),
      requestId: data?.requestId,
      retryable,
    };
  }
  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'Something went wrong.',
    retryable: false,
  };
}

export function isAppError(value: unknown): value is AppError {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'code' in value &&
      'retryable' in value,
  );
}

/** Learner routes that are not deployed yet reject with this code. */
export function isFeatureUnavailable(value: unknown): boolean {
  return isAppError(value) && value.code === 'feature_unavailable';
}

function pathOnly(url?: string): string {
  return (url ?? '').split('?')[0];
}

/** Checkout calls that the learner API can reject without ending the sign-in. */
function isPaymentPath(url?: string): boolean {
  const path = pathOnly(url);
  return (
    path === '/checkout/quote' ||
    path === '/orders' ||
    path === '/payments/verify' ||
    path === '/payments/verify-payment' ||
    path === '/payments/create-order' ||
    path === '/payments/restore' ||
    path === '/create-order' ||
    path === '/verify-payment' ||
    path === '/me/orders' ||
    /^\/orders\/[^/]+$/.test(path)
  );
}

/** The handover marks only these learner routes as Bearer-authenticated. */
export function requiresLearnerAuth(method: string | undefined, url?: string): boolean {
  const verb = (method ?? 'get').toLowerCase();
  const path = pathOnly(url);
  if (verb === 'post' && path === '/auth/logout') return true;
  if (verb === 'get' && ['/me', '/home/me', '/me/enrollments', '/me/entitlements', '/me/documents'].includes(path)) {
    return true;
  }
  if (verb === 'get' && /^\/me\/documents\/[^/]+$/.test(path)) return true;
  if (verb === 'patch' && path === '/me') return true;
  if (verb === 'get' && /^\/courses\/[^/]+\/access$/.test(path)) return true;
  if (verb === 'post' && /^\/courses\/[^/]+\/enroll$/.test(path)) return true;
  if (verb === 'post' && /^\/lessons\/[^/]+\/(?:progress|complete)$/.test(path)) return true;
  if (verb === 'post' && /^\/resources\/[^/]+\/download-authorization$/.test(path)) return true;
  if (verb === 'get' && (path === '/me/attempts' || path === '/practice/daily')) return true;
  if (verb === 'get' && /^\/attempts\/[^/]+(?:\/result)?$/.test(path)) return true;
  if (verb === 'post' && /^\/tests\/[^/]+\/attempts$/.test(path)) return true;
  if (verb === 'put' && /^\/attempts\/[^/]+\/answers\/[^/]+$/.test(path)) return true;
  if (verb === 'post' && /^\/attempts\/[^/]+\/submit$/.test(path)) return true;
  if (verb === 'put' && /^\/facts\/[^/]+\/reaction$/.test(path)) return true;
  if (verb === 'post' && /^\/live-classes\/[^/]+\/(?:join|chat)$/.test(path)) return true;
  if (verb === 'put' && /^\/live-classes\/[^/]+\/(?:hand|reminder)$/.test(path)) return true;
  if (verb === 'get' && /^\/live-classes\/[^/]+\/chat$/.test(path)) return true;
  if (verb === 'get' && path === '/me/notifications') return true;
  if (verb === 'patch' && /^\/me\/notifications\/[^/]+$/.test(path)) return true;
  if (verb === 'post' && path === '/me/notifications/clear') return true;
  if (verb === 'put' && path === '/me/push-devices/current') return true;
  if (verb === 'post' && path === '/me/push-devices/unregister') return true;
  if (
    verb === 'post' &&
    (path === '/checkout/quote' ||
      path === '/orders' ||
      path === '/payments/verify' ||
      path === '/payments/verify-payment' ||
      path === '/payments/create-order' ||
      path === '/payments/restore' ||
      path === '/create-order' ||
      path === '/verify-payment')
  ) {
    return true;
  }
  if (verb === 'get' && (path === '/me/orders' || /^\/orders\/[^/]+$/.test(path))) return true;
  return false;
}

export function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: appConfig.apiBaseUrl,
    timeout: appConfig.requestTimeoutMs,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  let sessionCheck: {generation: number; promise: Promise<boolean>} | null = null;

  /** A 401 from one route is not a dead sign-in while GET /me still accepts the token. */
  function sessionStillValid(generation: number): Promise<boolean> {
    if (sessionCheck?.generation === generation) return sessionCheck.promise;
    const promise = client.get('/me', {
      headers: {'X-Session-Probe': '1'},
    })
      .then(() => generation === currentSessionGeneration())
      .catch((probeError: unknown) => {
        if (generation !== currentSessionGeneration()) return false;
        const status = axios.isAxiosError(probeError)
          ? probeError.response?.status
          : (probeError as AppError).httpStatus;
        return status !== 401;
      })
      .finally(() => {
        if (sessionCheck?.promise === promise) sessionCheck = null;
      });
    sessionCheck = {generation, promise};
    return promise;
  }

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(config.url ?? '')) {
      throw {
        code: 'unsafe_url',
        message: 'Invalid API destination.',
        retryable: false,
      } satisfies AppError;
    }
    const request = config as RequestConfig;
    const probeHeader = config.headers?.get?.('X-Session-Probe') ?? config.headers?.['X-Session-Probe'];
    if (probeHeader === '1') {
      request.sessionProbe = true;
      config.headers.delete?.('X-Session-Probe');
      delete config.headers['X-Session-Probe'];
    }
    const needsAuth = requiresLearnerAuth(config.method, config.url);
    const token = tokenStore.getAccessToken();
    request.learnerAuthenticated = needsAuth;
    request.sessionGeneration = currentSessionGeneration();
    if (needsAuth) {
      if (!token) {
        throw {
          code: 'UNAUTHORIZED',
          message: 'Sign in to continue.',
          httpStatus: 401,
          retryable: false,
        } satisfies AppError;
      }
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  });

  client.interceptors.response.use(
    response => {
      const request = response.config as RequestConfig;
      if (request.sessionGeneration !== currentSessionGeneration()) {
        return Promise.reject({
          code: 'session_changed',
          message: 'Your session changed. Please retry.',
          retryable: false,
        } satisfies AppError);
      }
      return response;
    },
    async error => {
      const request = error.config as RequestConfig | undefined;
      if (
        request?.sessionGeneration !== undefined &&
        request.sessionGeneration !== currentSessionGeneration()
      ) {
        return Promise.reject({
          code: 'session_changed',
          message: 'Your session changed.',
          retryable: false,
        } satisfies AppError);
      }
      if (error.response?.status === 401 && request?.learnerAuthenticated && !request.sessionProbe) {
        const generation = request.sessionGeneration ?? currentSessionGeneration();
        const alive = await sessionStillValid(generation);
        if (!alive && generation === currentSessionGeneration()) {
          tokenStore.onSessionRevoked();
          await clearSessionTokens().catch(() => undefined);
        } else if (alive && isPaymentPath(request.url)) {
          return Promise.reject({
            code: 'payment_unavailable',
            message: 'Payment could not be started. You are still signed in.',
            httpStatus: 401,
            retryable: false,
          } satisfies AppError);
        }
      }
      return Promise.reject(toAppError(error));
    },
  );

  return client;
}

export const http = createHttpClient();
