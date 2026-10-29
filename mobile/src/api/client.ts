import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getDefaultApiBaseUrl } from '../config/constants';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  migrateTokensFromAsyncStorage,
  setTokens,
} from '../services/tokenStorage';

function assertAllowedApiHost(baseURL: string): string {
  let parsed: URL;
  try {
    parsed = new URL(baseURL);
  } catch {
    throw new Error('Invalid API base URL');
  }
  if (!__DEV__ && parsed.protocol !== 'https:') {
    throw new Error('Release builds require an HTTPS API host');
  }
  return baseURL.replace(/\/$/, '');
}

const API_BASE_URL = assertAllowedApiHost(getDefaultApiBaseUrl());

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

export async function initApiClient() {
  await migrateTokensFromAsyncStorage();
  const token = await getAccessToken();
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Single in-flight refresh — concurrent 401s share one network call. */
let refreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  // Bare axios instance — must not use `api` or we re-enter the interceptor.
  const { data } = await axios.post<{
    accessToken: string;
    refreshToken?: string;
  }>(
    `${API_BASE_URL}/api/auth/refresh`,
    { refreshToken },
    {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    },
  );

  await setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? refreshToken,
  });
  setAuthToken(data.accessToken);
  return data.accessToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh()
      .catch(async () => {
        await clearTokens();
        setAuthToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function forceSignOut(): Promise<void> {
  await clearTokens();
  setAuthToken(null);
  onUnauthorized?.();
}

api.interceptors.response.use(
  r => r,
  async (error: AxiosError<{ error?: string }>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original) {
      return Promise.reject(error);
    }

    const requestUrl = original.url ?? '';
    if (requestUrl.includes('/api/auth/refresh') || original._retry) {
      await forceSignOut();
      return Promise.reject(error);
    }

    original._retry = true;
    const newAccess = await refreshAccessToken();

    if (!newAccess) {
      await forceSignOut();
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api.request(original);
  },
);

/** True when the server rejected the session (not a transport failure). */
export function isAuthFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}

/** True when there is no HTTP response (offline, DNS, timeout, etc.). */
export function isNetworkFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return !error.response;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | {
          error?: string;
          message?: string;
          details?: { message?: string }[];
        }
      | string
      | undefined;

    const bodyError =
      typeof data === 'object' && data !== null
        ? typeof data.error === 'string'
          ? data.error
          : typeof data.message === 'string'
            ? data.message
            : undefined
        : typeof data === 'string'
          ? data
          : undefined;

    if (typeof bodyError === 'string' && bodyError.trim()) {
      const detail =
        typeof data === 'object' && data !== null
          ? data.details?.[0]?.message
          : undefined;
      if (detail && bodyError === 'Validation failed') {
        return detail;
      }
      return bodyError;
    }

    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (error.message === 'Network Error' || !error.response) {
      return 'Cannot reach server. Make sure the backend is running.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
