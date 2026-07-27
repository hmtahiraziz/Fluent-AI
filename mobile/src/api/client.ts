import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError } from 'axios';
import { getDefaultApiBaseUrl, TOKEN_STORAGE_KEY } from '../config/constants';

export const api = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

export async function initApiClient() {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
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

api.interceptors.response.use(
  r => r,
  (error: AxiosError<{ error?: string }>) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.error;
    if (typeof msg === 'string') return msg;
    if (error.message === 'Network Error') {
      return 'Cannot reach server. Make sure the backend is running.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
