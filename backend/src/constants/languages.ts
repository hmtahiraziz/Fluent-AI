export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type LanguageMeta = {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  rtl?: boolean;
};

export const TARGET_LANGUAGES: readonly LanguageMeta[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italian", nativeLabel: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇵🇹" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "Korean", nativeLabel: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", flag: "🇨🇳" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", flag: "🇵🇰", rtl: true },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦", rtl: true },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", flag: "🇹🇷" },
  { code: "ru", label: "Russian", nativeLabel: "Русский", flag: "🇷🇺" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polish", nativeLabel: "Polski", flag: "🇵🇱" },
  { code: "sv", label: "Swedish", nativeLabel: "Svenska", flag: "🇸🇪" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", flag: "🇮🇩" },
] as const;

export const LANGUAGE_CODES = TARGET_LANGUAGES.map((l) => l.code);

export const CEFR_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Beginner — basic phrases and introductions",
  A2: "Elementary — simple everyday conversations",
  B1: "Intermediate — familiar topics and opinions",
  B2: "Upper intermediate — fluent discussions",
  C1: "Advanced — complex topics and nuance",
  C2: "Proficient — near-native precision",
};

export function isValidLanguage(code: string): boolean {
  return (LANGUAGE_CODES as readonly string[]).includes(code);
}

export function isValidLevel(level: string): level is CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(level);
}

export function languageLabel(code: string): string {
  return TARGET_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export function languageMeta(code: string): LanguageMeta {
  return (
    TARGET_LANGUAGES.find((l) => l.code === code) ?? {
      code,
      label: code,
      nativeLabel: code,
      flag: "🌐",
    }
  );
}
