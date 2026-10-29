/**
 * Curated model-quality evaluation set (NOT a CI unit-test gate).
 * Run manually when OPENAI_API_KEY is available — see tutor.evaluation.md notes in release report.
 *
 * Each case documents expected qualitative properties that schema validation cannot guarantee:
 * correction accuracy, CEFR suitability, and language compliance.
 */
export type TutorEvalCase = {
  id: string;
  description: string;
  language: string;
  nativeLanguage: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  motivation: string;
  userMessage: string;
  expect: {
    replyLanguageHint: string;
    correctionNull: boolean;
    explanationLanguageHint?: string;
    maxReplyWordsApprox?: number;
  };
};

export const TUTOR_EVAL_CASES: TutorEvalCase[] = [
  {
    id: "correct-a1-es",
    description: "Correct A1 Spanish — no correction",
    language: "es",
    nativeLanguage: "en",
    level: "A1",
    motivation: "fun",
    userMessage: "Hola, me llamo Ana.",
    expect: {
      replyLanguageHint: "Spanish",
      correctionNull: true,
      maxReplyWordsApprox: 40,
    },
  },
  {
    id: "grammar-es-en",
    description: "Ser/estar mistake — correction with English explanation",
    language: "es",
    nativeLanguage: "en",
    level: "A2",
    motivation: "travel",
    userMessage: "Yo soy bien hoy.",
    expect: {
      replyLanguageHint: "Spanish",
      correctionNull: false,
      explanationLanguageHint: "English",
    },
  },
  {
    id: "a1-simplicity",
    description: "A1 reply should stay short and simple",
    language: "fr",
    nativeLanguage: "en",
    level: "A1",
    motivation: "school",
    userMessage: "Bonjour!",
    expect: {
      replyLanguageHint: "French",
      correctionNull: true,
      maxReplyWordsApprox: 30,
    },
  },
  {
    id: "c1-complexity",
    description: "C1 may use richer vocabulary",
    language: "fr",
    nativeLanguage: "en",
    level: "C1",
    motivation: "work",
    userMessage:
      "Je trouve que le télétravail transforme profondément nos habitudes professionnelles.",
    expect: {
      replyLanguageHint: "French",
      correctionNull: true,
    },
  },
  {
    id: "rtl-urdu",
    description: "Urdu reply should use Urdu script (RTL)",
    language: "ur",
    nativeLanguage: "en",
    level: "A2",
    motivation: "family",
    userMessage: "آپ کیسے ہیں؟",
    expect: {
      replyLanguageHint: "Urdu",
      correctionNull: true,
    },
  },
];
