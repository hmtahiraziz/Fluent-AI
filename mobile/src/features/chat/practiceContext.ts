export const PRACTICE_TOPICS = [
  'grammar',
  'culture',
  'business',
  'travel',
] as const;

export type PracticeTopic = (typeof PRACTICE_TOPICS)[number];

export type PracticeSessionSource =
  | 'home_topic'
  | 'home_recommendation'
  | 'home_new';

export type PracticeSessionContext = {
  topic?: PracticeTopic;
  scenario?: string;
  /** Optional first user message / title seed */
  initialPrompt?: string;
  source: PracticeSessionSource;
};

const TOPIC_SET = new Set<string>(PRACTICE_TOPICS);
const SCENARIO_MAX = 120;

export function isPracticeTopic(value: unknown): value is PracticeTopic {
  return typeof value === 'string' && TOPIC_SET.has(value);
}

export function sanitizeScenario(scenario?: string | null): string | undefined {
  if (!scenario) return undefined;
  const trimmed = scenario.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, SCENARIO_MAX);
}

/** Validate client context before create; drops invalid topic/scenario. */
export function normalizePracticeContext(
  ctx?: PracticeSessionContext | null,
): {
  topic?: PracticeTopic;
  scenario?: string;
  initialPrompt?: string;
  source: PracticeSessionSource;
} | null {
  if (!ctx) return null;
  const topic = ctx.topic && isPracticeTopic(ctx.topic) ? ctx.topic : undefined;
  const scenario = sanitizeScenario(ctx.scenario);
  const initialPrompt = ctx.initialPrompt?.trim() || undefined;
  return {
    topic,
    scenario,
    initialPrompt,
    source: ctx.source,
  };
}
