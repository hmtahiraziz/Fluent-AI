export type User = { id: string; email: string };

export type MessageCorrection = {
  original: string;
  corrected: string;
  explanation: string;
  /** Optional idiomatic alternative; omitted when not useful. */
  naturalAlternative?: string | null;
};

export type VocabularySuggestion = {
  term: string;
  meaning: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  correction: MessageCorrection | null;
  vocabularySuggestions?: VocabularySuggestion[] | null;
  createdAt: string;
};

export type PracticeTopic = 'grammar' | 'culture' | 'business' | 'travel';

export type Conversation = {
  id: string;
  userId: string;
  title: string | null;
  language: string;
  level: string;
  nativeLanguage?: string;
  motivation?: string;
  topic?: PracticeTopic | null;
  scenario?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type LearningState =
  | 'new'
  | 'learning'
  | 'review'
  | 'difficult'
  | 'mastered';

export type VocabRating = 'again' | 'hard' | 'good' | 'easy';

export type VocabularyItem = {
  id: string;
  userId: string;
  language: string;
  phrase: string;
  phraseKey?: string;
  translation: string | null;
  note: string | null;
  pronunciation?: string | null;
  exampleSentence?: string | null;
  sourceMessageId: string | null;
  learningState?: LearningState;
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  lapses?: number;
  nextReviewAt?: string | null;
  lastReviewedAt?: string | null;
  reviewVersion?: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type VocabularyStats = {
  total: number;
  dueCount: number;
  byState: Record<LearningState, number>;
  createdToday?: number;
};

export type VocabularySource = {
  messageId: string;
  conversationId: string;
  title: string | null;
  excerpt: string;
};

export type WeeklyDayProgress = {
  date: string;
  practiceMinutes: number;
  wordsLearned: number;
  wordsReviewed: number;
  reviewSuccesses: number;
  reviewTotal: number;
};

export type WeeklyProgress = {
  timeZone: string;
  days: WeeklyDayProgress[];
  totals: {
    practiceMinutes: number;
    wordsLearned: number;
    wordsReviewed: number;
    reviewSuccesses: number;
    reviewTotal: number;
  };
  /** (good|easy)/completed; null if no reviews. Not a proficiency score. */
  reviewSuccessRate: number | null;
};

export type UserSettings = {
  targetLanguage: string;
  nativeLanguage: string;
  level: string;
  motivation?: string;
  onboardingCompleted: boolean;
  dailyGoalMinutes: number;
  llmConsentVersion?: string | null;
  llmConsentAt?: string | null;
  hasLlmConsent?: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
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
