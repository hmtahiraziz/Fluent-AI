export type User = { id: string; email: string };

export type MessageCorrection = {
  original: string;
  corrected: string;
  explanation: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  correction: MessageCorrection | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  title: string | null;
  language: string;
  level: string;
  createdAt: string;
};

export type VocabularyItem = {
  id: string;
  userId: string;
  language: string;
  phrase: string;
  translation: string | null;
  note: string | null;
  sourceMessageId: string | null;
  createdAt: string;
};

export type UserSettings = {
  targetLanguage: string;
  nativeLanguage: string;
  level: string;
  onboardingCompleted: boolean;
  dailyGoalMinutes: number;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
  settings: UserSettings | null;
};

export type LanguageOption = {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  rtl?: boolean;
};

export type OnboardingDraft = {
  step: number;
  nativeLanguage: string;
  targetLanguage: string;
  motivation: string;
  level: string;
  dailyGoalMinutes: number;
};
