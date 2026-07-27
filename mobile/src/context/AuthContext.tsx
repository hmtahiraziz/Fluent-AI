import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initApiClient,
  registerUnauthorizedHandler,
  setAuthToken,
} from '../api/client';
import * as apiService from '../api/endpoints';
import type { User, UserSettings } from '../api/types';
import type { PendingChat } from '../navigation/types';
import { TOKEN_STORAGE_KEY } from '../config/constants';

type AuthState = {
  user: User | null;
  token: string | null;
  settings: UserSettings | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  pendingChat: PendingChat | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<UserSettings | null>;
  setSettings: (settings: UserSettings) => void;
  setPendingChat: (chat: PendingChat | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<UserSettings | null>(null);
  const [pendingChat, setPendingChatState] = useState<PendingChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setSettingsState(null);
    setPendingChatState(null);
    setAuthToken(null);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  useEffect(() => {
    void (async () => {
      await initApiClient();
      registerUnauthorizedHandler(() => {
        void logout();
      });
      const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        setToken(stored);
        setAuthToken(stored);
        try {
          const me = await apiService.fetchMe();
          setUser(me.user);
          if (me.settings) setSettingsState(me.settings);
        } catch {
          /* token may be expired */
        }
      }
      setIsLoading(false);
    })();
  }, [logout]);

  const persistSession = useCallback(
    async (accessToken: string, u: User, s: UserSettings | null) => {
      setToken(accessToken);
      setUser(u);
      setAuthToken(accessToken);
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      if (s) {
        setSettingsState(s);
      } else {
        await refreshSettings();
      }
    },
    [refreshSettings],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiService.login(email, password);
      await persistSession(data.accessToken, data.user, data.settings);
    },
    [persistSession],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const data = await apiService.register(email, password);
      await persistSession(data.accessToken, data.user, data.settings);
    },
    [persistSession],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      settings,
      isLoading,
      isAuthenticated: !!token,
      isOnboarded: !!settings?.onboardingCompleted,
      pendingChat,
      login,
      register,
      logout,
      refreshSettings,
      setSettings,
      setPendingChat,
    }),
    [
      user,
      token,
      settings,
      isLoading,
      pendingChat,
      login,
      register,
      logout,
      refreshSettings,
      setSettings,
      setPendingChat,
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
