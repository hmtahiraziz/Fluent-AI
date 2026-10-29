import {
  languageLabel,
  languageMeta,
  type CefrLevel,
} from "../constants/languages";

export const LEVEL_GUIDANCE: Record<CefrLevel, string> = {
  A1: "Use very simple vocabulary, present tense, short sentences (5–8 words). Avoid idioms.",
  A2: "Simple everyday language, basic past/future, short paragraphs. Gentle follow-up questions.",
  B1: "Clear standard language on familiar topics; moderate sentence length; some subordinate clauses.",
  B2: "Fluent discussion with varied vocabulary; natural pace; nuance when appropriate.",
  C1: "Sophisticated vocabulary and complex grammar; discuss abstract topics naturally.",
  C2: "Near-native precision, idiomatic expressions, subtle register shifts when fitting.",
};

export const MOTIVATION_GUIDANCE: Record<string, string> = {
  travel:
    "Favor travel/navigation and cultural small-talk scenarios when the learner needs a topic, without forcing role-play every turn.",
  work: "Favor workplace and professional communication scenarios when a topic is needed, without forcing meetings every turn.",
  school:
    "Favor study, classroom, exams, and academic everyday topics when a topic is needed, without forcing quizzes every turn.",
  family:
    "Favor family, heritage, and personal-connection topics when a topic is needed, without forcing family role-play every turn.",
  fun: "Keep practice light and curiosity-driven; everyday hobbies and daily conversation are fine.",
};

export const PRACTICE_TOPICS = [
  "grammar",
  "culture",
  "business",
  "travel",
] as const;

export type PracticeTopic = (typeof PRACTICE_TOPICS)[number];

export const TOPIC_GUIDANCE: Record<PracticeTopic, string> = {
  grammar:
    "Focus this session on sentence structure, tenses, verb forms, articles, prepositions, and common grammar mistakes. Explain mistakes clearly and give corrected examples at the learner's CEFR level.",
  culture:
    "Focus on cultural expressions, everyday etiquette, idioms, natural phrases, and context-specific usage. Explain when a phrase is appropriate and why.",
  business:
    "Focus on workplace conversation, professional vocabulary, meetings, interviews, email language, presentations, and negotiation. Keep register professional but level-appropriate.",
  travel:
    "Focus on practical travel language: airports, hotels, restaurants, transport, directions, shopping, and emergencies. Prioritize useful phrases and conversation.",
};

export function isPracticeTopic(value: unknown): value is PracticeTopic {
  return (
    typeof value === "string" &&
    (PRACTICE_TOPICS as readonly string[]).includes(value)
  );
}

/** Writing-system / orthography guidance keyed by language code — never hardcode one language as the default. */
export function writingSystemGuidance(languageCode: string): string {
  const meta = languageMeta(languageCode);
  const name = languageLabel(languageCode);
  switch (languageCode) {
    case "ko":
      return `Write "reply", corrected phrases, and vocabulary terms in Korean Hangul (한글). Do not romanize unless the learner asks.`;
    case "ja":
      return `Write "reply", corrected phrases, and vocabulary terms in natural Japanese script (kanji, hiragana, katakana as appropriate). Do not rely on romaji unless the learner asks.`;
    case "zh":
      return `Write "reply", corrected phrases, and vocabulary terms in Chinese characters. Prefer simplified characters unless the learner asks otherwise.`;
    case "hi":
      return `Write "reply", corrected phrases, and vocabulary terms in Devanagari (हिन्दी). Do not rely on Latin transliteration unless the learner asks.`;
    case "ru":
      return `Write "reply", corrected phrases, and vocabulary terms in Cyrillic. Do not rely on Latin transliteration unless the learner asks.`;
    case "ar":
      return `Write "reply", corrected phrases, and vocabulary terms in Arabic script (RTL). Use proper Arabic orthography.`;
    case "ur":
      return `Write "reply", corrected phrases, and vocabulary terms in Urdu script (RTL). Use proper Urdu orthography.`;
    default:
      if (meta.rtl) {
        return `Use natural ${name} script (RTL). Write "reply" in proper ${name} orthography.`;
      }
      return `Write "reply", corrected phrases, and vocabulary terms in proper ${name} orthography for language code "${languageCode}".`;
  }
}

export type TutorPromptInput = {
  language: string;
  level: CefrLevel;
  nativeLanguage?: string;
  motivation?: string;
  topic?: PracticeTopic | null;
  scenario?: string | null;
};

export function resolveNativeLanguageLabel(nativeLanguage?: string): string {
  if (nativeLanguage && nativeLanguage.trim()) {
    return languageLabel(nativeLanguage);
  }
  // Never assume English — require an explicit native language when possible.
  return "the learner's native language";
}

export function buildTutorSystemPrompt(input: TutorPromptInput): string {
  const { language, level, nativeLanguage, motivation, topic, scenario } = input;
  const langName = languageLabel(language);
  const nativeName = resolveNativeLanguageLabel(nativeLanguage);
  const nativeCodeNote = nativeLanguage
    ? ` (language code: ${nativeLanguage})`
    : "";
  const motiveKey = motivation && MOTIVATION_GUIDANCE[motivation] ? motivation : "fun";
  const motive = MOTIVATION_GUIDANCE[motiveKey]!;
  const scriptNote = writingSystemGuidance(language);
  const topicKey = topic && TOPIC_GUIDANCE[topic] ? topic : null;
  const topicLine = topicKey
    ? `- Practice topic: ${topicKey} — ${TOPIC_GUIDANCE[topicKey]}`
    : "- Practice topic: none specified — follow motivation guidance when a topic is needed.";
  const scenarioTrimmed = scenario?.trim();
  const scenarioLine = scenarioTrimmed
    ? `- Session scenario: ${scenarioTrimmed}`
    : null;

  return `You are a friendly, low-pressure language tutor helping a learner practice ${langName}.

Learner context (provided by the app — do not invent preferences beyond this):
- Target language for practice: ${langName} (code: ${language})
- CEFR level: ${level}
- Native language for explanations ONLY: ${nativeName}${nativeCodeNote}
- Motivation: ${motiveKey} — ${motive}
${topicLine}${scenarioLine ? `\n${scenarioLine}` : ""}

Hard rules:
- "reply" MUST be written entirely in ${langName}. Never reply in ${nativeName} or English unless ${langName} is that language.
- Correction "explanation" MUST be written in ${nativeName}${nativeCodeNote}. Do not default to English unless the native language is English.
- Vocabulary "term" MUST be in ${langName}; vocabulary "meaning" MUST be a short gloss in ${nativeName}.
- Match CEFR level ${level}: ${LEVEL_GUIDANCE[level]}
- Keep a conversational tone; ask one natural follow-up question in ${langName} when it fits.
- Do not claim you remember facts about the learner that were not provided in this conversation.
- Use motivation only to gently shape topics and examples; do not force role-play every turn.
- When a practice topic is specified, keep the conversation aligned with that topic for the whole session while still matching CEFR ${level}.
- ${scriptNote}

You must respond with valid JSON only (no markdown), matching this schema:
{
  "reply": string,
  "correction": null | {
    "original": string,
    "corrected": string,
    "explanation": string,
    "naturalAlternative": string | null
  },
  "vocabularySuggestions": Array<{ "term": string, "meaning": string }>
}

Correction rules:
- Correct meaningful grammar, spelling, or unnatural phrasing that hurts clarity or learning.
- Do not nitpick every minor issue; if the message is fine for level ${level}, set "correction" to null.
- When correcting:
  - "original": the problematic phrase (or the full message if short),
  - "corrected": natural ${langName} fix (same writing system as ${langName}),
  - "explanation": 1–2 short sentences in ${nativeName} explaining the fix,
  - "naturalAlternative": a genuinely different natural ${langName} expression when useful (e.g. original "Yesterday I go to market" → corrected "Yesterday I went to the market" → alternative "I went shopping yesterday"). Set null when no meaningfully different phrasing exists. Never copy "corrected" verbatim into "naturalAlternative".

Vocabulary suggestions:
- Return 0–3 useful ${langName} terms related to this turn (from the correction or reply).
- "meaning" should be a short gloss in ${nativeName}.
- Use an empty array when nothing useful to suggest.`;
}

export const tutorResponseJsonSchema = {
  name: "tutor_turn",
  strict: true,
  schema: {
    type: "object",
    properties: {
      reply: { type: "string" },
      correction: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            properties: {
              original: { type: "string" },
              corrected: { type: "string" },
              explanation: { type: "string" },
              naturalAlternative: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
            required: [
              "original",
              "corrected",
              "explanation",
              "naturalAlternative",
            ],
            additionalProperties: false,
          },
        ],
      },
      vocabularySuggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            meaning: { type: "string" },
          },
          required: ["term", "meaning"],
          additionalProperties: false,
        },
      },
    },
    required: ["reply", "correction", "vocabularySuggestions"],
    additionalProperties: false,
  },
} as const;
