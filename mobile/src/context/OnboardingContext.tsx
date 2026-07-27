import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingDraft } from '../api/types';
import { ONBOARDING_DRAFT_KEY } from '../config/constants';

const defaultDraft: OnboardingDraft = {
  step: 1,
  nativeLanguage: 'en',
  targetLanguage: 'es',
  motivation: 'fun',
  level: 'A1',
  dailyGoalMinutes: 10,
};

type OnboardingContextValue = {
  draft: OnboardingDraft;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  resetDraft: () => Promise<void>;
  clearDraft: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);

  useEffect(() => {
    void (async () => {
      const raw = await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (raw) {
        try {
          setDraft({ ...defaultDraft, ...JSON.parse(raw) });
        } catch {
          /* ignore corrupt draft */
        }
      }
    })();
  }, []);

  const updateDraft = useCallback(
    (patch: Partial<OnboardingDraft>) => {
      setDraft(prev => {
        const next = { ...prev, ...patch };
        void AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const resetDraft = useCallback(async () => {
    setDraft(defaultDraft);
    await AsyncStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify(defaultDraft),
    );
  }, []);

  const clearDraft = useCallback(async () => {
    setDraft(defaultDraft);
    await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY);
  }, []);

  const value = useMemo(
    () => ({ draft, updateDraft, resetDraft, clearDraft }),
    [draft, updateDraft, resetDraft, clearDraft],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
