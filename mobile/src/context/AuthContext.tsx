import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getErrorMessage,
  initApiClient,
  isAuthFailure,
  registerUnauthorizedHandler,
  setAuthToken,
} from '../api/client';
import * as apiService from '../api/endpoints';
import type { User, UserSettings } from '../api/types';
import type { PendingChat } from '../navigation/types';
import { clearLocalAppData } from '../services/localDataCleanup';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../services/tokenStorage';

type AuthState = {
  user: User | null;
  token: string | null;
  settings: UserSettings | null;
  isLoading: boolean;
  /** Credentials exist but /me could not be reached — do not clear Keychain. */
  sessionOffline: boolean;
  sessionError: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  pendingChat: PendingChat | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, ageConfirmed: true) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshSettings: () => Promise<UserSettings | null>;
  setSettings: (settings: UserSettings) => void;
  setPendingChat: (chat: PendingChat | null) => void;
  acceptLlmConsent: () => Promise<UserSettings | null>;
  retrySessionRestore: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<UserSettings | null>(null);
  const [pendingChat, setPendingChatState] = useState<PendingChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionOffline, setSessionOffline] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const setSettings = useCallback((s: UserSettings) => {
    setSettingsState(s);
  }, []);

  const setPendingChat = useCallback((chat: PendingChat | null) => {
    setPendingChatState(chat);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const s = await apiService.fetchSettings();
      setSettingsState(s);
      return s;
    } catch {
      return null;
    }
  }, []);

  const acceptLlmConsent = useCallback(async () => {
    const s = await apiService.updateSettings({ acceptLlmConsent: true });
    setSettingsState(s);
    return s;
  }, []);

  const logout = useCallback(async () => {
    const refresh = await getRefreshToken();
    await apiService.logoutRemote(refresh);
    setUser(null);
    setToken(null);
    setSettingsState(null);
    setPendingChatState(null);
    setSessionOffline(false);
    setSessionError(null);
    setAuthToken(null);
    await clearTokens();
    // Keep display name / avatar for the next sign-in on this device.
    await clearLocalAppData({ includeProfile: false });
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await apiService.deleteAccount(password);
    setUser(null);
    setToken(null);
    setSettingsState(null);
    setPendingChatState(null);
    setSessionOffline(false);
    setSessionError(null);
    setAuthToken(null);
    await clearTokens();
    await clearLocalAppData({ includeProfile: true });
  }, []);

  const clearInvalidSession = useCallback(async () => {
    setUser(null);
    setToken(null);
    setSettingsState(null);
    setPendingChatState(null);
    setSessionOffline(false);
    setSessionError(null);
    setAuthToken(null);
    await clearTokens();
  }, []);

  /**
   * Validate Keychain credentials with the backend.
   * - 401/403 → clear credentials (invalid session)
   * - Network / 5xx → keep Keychain; surface offline restore UI
   */
  const restoreSession = useCallback(async () => {
    setSessionOffline(false);
    setSessionError(null);

    const stored = await getAccessToken();
    if (!stored) {
      setToken(null);
      setUser(null);
      setSettingsState(null);
      return;
    }

    // Authorize API calls, but only mark React session authenticated after /me succeeds.
    setAuthToken(stored);

    try {
      const me = await apiService.fetchMe();
      setToken(stored);
      setUser(me.user);
      if (me.settings) setSettingsState(me.settings);
      else setSettingsState(null);
      setSessionOffline(false);
      setSessionError(null);
    } catch (error) {
      if (isAuthFailure(error)) {
        await clearInvalidSession();
        return;
      }

      // Transient failure — keep Keychain secrets; block navigation until retry.
      setToken(null);
      setUser(null);
      setSettingsState(null);
      setSessionOffline(true);
      setSessionError(getErrorMessage(error));
    }
  }, [clearInvalidSession]);

  const retrySessionRestore = useCallback(async () => {
    setIsLoading(true);
    try {
      await restoreSession();
    } finally {
      setIsLoading(false);
    }
  }, [restoreSession]);

  useEffect(() => {
    void (async () => {
      await initApiClient();
      registerUnauthorizedHandler(() => {
        void logout();
      });
      await restoreSession();
      setIsLoading(false);
    })();
  }, [logout, restoreSession]);

  const persistSession = useCallback(
    async (
      accessToken: string,
      u: User,
      s: UserSettings | null,
      refreshToken?: string | null,
    ) => {
      setSessionOffline(false);
      setSessionError(null);
      // Authorize the client and persist secrets first — do NOT flip React
      // auth state yet. An await between setToken and setSettings caused a
      // one-frame Onboarding flash for already-onboarded users.
      setAuthToken(accessToken);
      await setTokens({ accessToken, refreshToken });

      let nextSettings = s;
      if (!nextSettings) {
        try {
          nextSettings = await apiService.fetchSettings();
        } catch {
          nextSettings = null;
        }
      }

      // Single synchronous batch: authenticated + onboarded resolve together.
      setToken(accessToken);
      setUser(u);
      setSettingsState(nextSettings);
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiService.login(email, password);
      await persistSession(
        data.accessToken,
        data.user,
        data.settings,
        data.refreshToken,
      );
    },
    [persistSession],
  );

  const register = useCallback(
    async (email: string, password: string, ageConfirmed: true) => {
      const data = await apiService.register(email, password, ageConfirmed);
      await persistSession(
        data.accessToken,
        data.user,
        data.settings,
        data.refreshToken,
      );
    },
    [persistSession],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      settings,
      isLoading,
      sessionOffline,
      sessionError,
      isAuthenticated: !!token,
      isOnboarded: !!settings?.onboardingCompleted,
      pendingChat,
      login,
      register,
      logout,
      deleteAccount,
      refreshSettings,
      setSettings,
      setPendingChat,
      acceptLlmConsent,
      retrySessionRestore,
    }),
    [
      user,
      token,
      settings,
      isLoading,
      sessionOffline,
      sessionError,
      pendingChat,
      login,
      register,
      logout,
      deleteAccount,
      refreshSettings,
      setSettings,
      setPendingChat,
      acceptLlmConsent,
      retrySessionRestore,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
