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

function pathOnly(url?: string): string {
  return (url ?? '').split('?')[0];
}

/** The handover marks only these learner routes as Bearer-authenticated. */
export function requiresLearnerAuth(method: string | undefined, url?: string): boolean {
  const verb = (method ?? 'get').toLowerCase();
  const path = pathOnly(url);
  if (verb === 'get' && ['/me', '/home/me', '/me/enrollments', '/me/entitlements', '/me/documents'].includes(path)) {
    return true;
  }
  if (verb === 'get' && /^\/me\/documents\/[^/]+$/.test(path)) return true;
  if (verb === 'patch' && path === '/me') return true;
  if (verb === 'get' && /^\/courses\/[^/]+\/access$/.test(path)) return true;
  if (verb === 'post' && /^\/courses\/[^/]+\/enroll$/.test(path)) return true;
  if (verb === 'post' && /^\/lessons\/[^/]+\/(?:progress|complete)$/.test(path)) return true;
  if (verb === 'post' && /^\/resources\/[^/]+\/download-authorization$/.test(path)) return true;
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

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(config.url ?? '')) {
      throw {
        code: 'unsafe_url',
        message: 'Invalid API destination.',
        retryable: false,
      } satisfies AppError;
    }
    const request = config as RequestConfig;
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
      if (error.response?.status === 401 && request?.learnerAuthenticated) {
        tokenStore.onSessionRevoked();
        await clearSessionTokens().catch(() => undefined);
      }
      return Promise.reject(toAppError(error));
    },
  );

  return client;
}

export const http = createHttpClient();
