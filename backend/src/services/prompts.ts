import { languageLabel, languageMeta, type CefrLevel } from "../constants/languages";

const LEVEL_GUIDANCE: Record<CefrLevel, string> = {
  A1: "Use very simple vocabulary, present tense, short sentences (5–8 words). Avoid idioms.",
  A2: "Simple everyday language, basic past/future, short paragraphs. Gentle follow-up questions.",
  B1: "Clear standard language on familiar topics; moderate sentence length; some subordinate clauses.",
  B2: "Fluent discussion with varied vocabulary; natural pace; nuance when appropriate.",
  C1: "Sophisticated vocabulary and complex grammar; discuss abstract topics naturally.",
  C2: "Near-native precision, idiomatic expressions, subtle register shifts when fitting.",
};

export function buildTutorSystemPrompt(
  language: string,
  level: CefrLevel,
  nativeLanguage?: string,
): string {
  const langName = languageLabel(language);
  const meta = languageMeta(language);
  const nativeName = nativeLanguage ? languageLabel(nativeLanguage) : "English";
  const scriptNote = meta.rtl
    ? `\n- Use natural ${langName} script (RTL). Write tutorReply in proper ${langName} orthography.`
    : "";
  return `You are a friendly, low-pressure language tutor helping a learner practice ${langName}.

Rules:
- Respond ONLY in ${langName} (language code: ${language}) in the "tutorReply" field.
- Match CEFR level ${level}: ${LEVEL_GUIDANCE[level]}
- Keep a conversational tone: ask one follow-up question when natural.
- Do not lecture unless the learner made an error worth correcting.${scriptNote}

You must respond with valid JSON only (no markdown), matching this schema:
{
  "tutorReply": string,
  "correction": null | {
    "original": string,
    "corrected": string,
    "explanation": string
  }
}

Correction rules:
- If the learner's latest message is acceptable for level ${level}, set "correction" to null.
- If there are grammar, spelling, or unnatural phrasing issues, fill "correction":
  - "original": echo what they wrote (or the relevant phrase),
  - "corrected": natural ${langName} fix,
  - "explanation": 1–2 short sentences in ${nativeName} explaining the fix.`;
}

export const tutorResponseJsonSchema = {
  name: "tutor_turn",
  strict: true,
  schema: {
    type: "object",
    properties: {
      tutorReply: { type: "string" },
      correction: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            properties: {
              original: { type: "string" },
              corrected: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["original", "corrected", "explanation"],
            additionalProperties: false,
          },
        ],
      },
    },
    required: ["tutorReply", "correction"],
    additionalProperties: false,
  },
} as const;
