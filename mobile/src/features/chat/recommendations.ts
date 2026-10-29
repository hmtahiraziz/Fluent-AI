import type { PracticeTopic } from './practiceContext';
import {
  getPracticeTopics,
  type PracticeForYouItem,
} from './practiceContentByLanguage';
import { localDayKey } from '../../services/practiceTimeStorage';

export type HomeRecommendation = {
  id: string;
  title: string;
  category: string;
  topic: PracticeTopic;
  scenario: string;
  durationMinutes: number;
  description: string;
  emoji: string;
  prompt: string;
};

type RankInput = {
  targetLanguage: string;
  cefrLevel?: string;
  motivation?: string;
  activeTopicId?: string | null;
  /** Stable local day key — do not change while interacting */
  dayKey?: string;
  limit?: number;
};

const MOTIVATION_TOPIC: Record<string, PracticeTopic> = {
  travel: 'travel',
  work: 'business',
  school: 'grammar',
  family: 'culture',
  fun: 'culture',
};

function hashDay(dayKey: string): number {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) {
    h = (h * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return h;
}

function levelHint(cefrLevel?: string): string {
  if (!cefrLevel) return '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    return ' Keep language simple for beginners.';
  }
  if (cefrLevel === 'C1' || cefrLevel === 'C2') {
    return ' Use natural advanced phrasing.';
  }
  return '';
}

function catalogForLanguage(
  targetLanguage: string,
  cefrLevel?: string,
): HomeRecommendation[] {
  const topics = getPracticeTopics(targetLanguage);
  const byId = Object.fromEntries(topics.map(t => [t.id, t]));
  const hint = levelHint(cefrLevel);

  const grammar = byId.grammar;
  const culture = byId.culture;
  const business = byId.business;
  const travel = byId.travel;

  const items: HomeRecommendation[] = [];

  if (travel) {
    items.push({
      id: 'travel-ready',
      title: 'Travel ready',
      category: 'Travel',
      topic: 'travel',
      scenario: 'Practical travel conversation',
      durationMinutes: 8,
      description: 'Learn useful phrases for your next trip.',
      emoji: '✈️',
      prompt: `${travel.prompt}${hint} Focus on checking into a hotel and asking for directions.`,
    });
  }

  if (culture) {
    items.push({
      id: 'cafe-chat',
      title: 'Café chat',
      category: 'Daily',
      topic: 'culture',
      scenario: 'Ordering at a café',
      durationMinutes: 5,
      description: 'Practice simple conversations at a café.',
      emoji: '☕',
      prompt: `${culture.prompt}${hint} Role-play ordering coffee and making small talk.`,
    });
  }

  if (grammar) {
    items.push({
      id: 'grammar-boost',
      title: 'Grammar Boost',
      category: 'Grammar',
      topic: 'grammar',
      scenario: 'Grammar practice',
      durationMinutes: 7,
      description: 'Build accurate sentences at your level.',
      emoji: '📘',
      prompt: `${grammar.prompt}${hint} Help me construct five short sentences using a useful tense for my level.`,
    });
  }

  if (business) {
    items.push({
      id: 'business-english',
      title: 'Business Practice',
      category: 'Business',
      topic: 'business',
      scenario: 'Workplace conversation',
      durationMinutes: 8,
      description: 'Meetings, introductions, and professional phrases.',
      emoji: '💼',
      prompt: `${business.prompt}${hint} Role-play a short workplace introduction or meeting.`,
    });
  }

  return items;
}

function scoreRecommendation(
  item: HomeRecommendation,
  input: RankInput,
  dayHash: number,
): number {
  let score = 10;
  const motiveTopic = input.motivation
    ? MOTIVATION_TOPIC[input.motivation]
    : undefined;
  if (motiveTopic && item.topic === motiveTopic) score += 40;
  if (input.activeTopicId && item.topic === input.activeTopicId) score += 30;

  // Stable day rotation — prefer different lead items across days without reshuffling mid-session.
  const rotate = (dayHash + item.id.charCodeAt(0)) % 4;
  score += rotate;

  return score;
}

/**
 * Deterministic ranking for Home "For You".
 * Pass a fixed dayKey for the session so interaction does not reshuffle.
 */
export function rankHomeRecommendations(input: RankInput): HomeRecommendation[] {
  const dayKey = input.dayKey ?? localDayKey();
  const dayHash = hashDay(dayKey);
  const limit = input.limit ?? 3;
  const catalog = catalogForLanguage(input.targetLanguage, input.cefrLevel);

  return [...catalog]
    .map(item => ({ item, score: scoreRecommendation(item, input, dayHash) }))
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit)
    .map(x => x.item);
}

/** Adapter for older For You card shape */
export function recommendationToForYouItem(
  item: HomeRecommendation,
): PracticeForYouItem {
  return {
    id: item.id,
    title: item.title,
    meta: `${item.durationMinutes} min • ${item.category}`,
    emoji: item.emoji,
    prompt: item.prompt,
    topic: item.topic,
    scenario: item.scenario,
    category: item.category,
    durationMinutes: item.durationMinutes,
    description: item.description,
  };
}
