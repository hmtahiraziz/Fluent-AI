import { Platform } from 'react-native';

export type LanguageMeta = {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  rtl?: boolean;
};

export const APP_NAME = 'FluentAI';

export const LANGUAGES: readonly LanguageMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', flag: '🇸🇪' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', flag: '🇮🇩' },
] as const;

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CEFR_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: 'Beginner — basic phrases and introductions',
  A2: 'Elementary — simple everyday conversations',
  B1: 'Intermediate — familiar topics and opinions',
  B2: 'Upper intermediate — fluent discussions',
  C1: 'Advanced — complex topics and nuance',
  C2: 'Proficient — near-native precision',
};

export const MOTIVATIONS = [
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'school', label: 'School', emoji: '🎓' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'fun', label: 'Just for fun', emoji: '🎉' },
] as const;

export const DAILY_GOALS = [5, 10, 15, 20] as const;

export const ONBOARDING_STEPS = 6;

const DEV_ANDROID = 'http://127.0.0.1:3000';
const DEV_IOS = 'http://localhost:3000';

export function getDefaultApiBaseUrl(): string {
  if (!__DEV__) {
    return 'https://api.example.com';
  }
  return Platform.OS === 'android' ? DEV_ANDROID : DEV_IOS;
}

export const TOKEN_STORAGE_KEY = '@ailanguage/access_token';
export const ONBOARDING_DRAFT_KEY = '@ailanguage/onboarding_draft';
export const LAST_PRACTICE_KEY = '@ailanguage/last_practice_date';
export const PENDING_CHAT_PROMPT_KEY = '@ailanguage/pending_chat_prompt';

export function languageMeta(code: string): LanguageMeta {
  return (
    LANGUAGES.find(l => l.code === code) ?? {
      code,
      label: code,
      nativeLabel: code,
      flag: '🌐',
    }
  );
}
