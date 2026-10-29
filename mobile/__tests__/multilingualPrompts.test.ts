import {
  getPracticeForYouItems,
  getPracticeTopics,
  isRtlTargetLanguage,
} from '../src/features/chat/practiceContentByLanguage';
import {
  getQuickReplies,
  getSuggestedPrompts,
} from '../src/features/chat/promptsByLanguage';

describe('multilingual practice prompts', () => {
  it('returns Korean Hangul practice prompts for ko', () => {
    const topics = getPracticeTopics('ko');
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0]!.prompt).toMatch(/[가-힣]/);
    const suggestions = getSuggestedPrompts('ko');
    expect(suggestions[0]).toMatch(/[가-힣]/);
    const quick = getQuickReplies('ko');
    expect(quick[0]).toMatch(/[가-힣]/);
  });

  it('returns Japanese script practice prompts for ja', () => {
    const topics = getPracticeTopics('ja');
    expect(topics[0]!.prompt).toMatch(/[\u3040-\u30ff\u4e00-\u9faf]/);
    expect(getSuggestedPrompts('ja')[0]).toMatch(/[\u3040-\u30ff\u4e00-\u9faf]/);
  });

  it('returns Spanish practice prompts for es', () => {
    const topics = getPracticeTopics('es');
    expect(topics.some(t => /Practiquemos|Ayúdame|Expliquemos/i.test(t.prompt))).toBe(
      true,
    );
    expect(getQuickReplies('es')[0]).toMatch(/Fui|Hacía|dice/i);
  });

  it('returns Arabic RTL practice prompts for ar', () => {
    const topics = getPracticeTopics('ar');
    expect(topics[0]!.prompt).toMatch(/[\u0600-\u06FF]/);
    expect(isRtlTargetLanguage('ar')).toBe(true);
    expect(getSuggestedPrompts('ar')[0]).toMatch(/[\u0600-\u06FF]/);
  });

  it('returns French prompts and personalizes forYou by motivation', () => {
    const topics = getPracticeTopics('fr');
    expect(topics[0]!.prompt).toMatch(/Entraînons|Aidez/i);
    const travel = getPracticeForYouItems('fr', 'travel');
    expect(travel[0]!.id).toBe('motivation-travel');
    expect(travel[0]!.prompt).toMatch(/chemin|hôtel/i);
  });

  it('falls back to English for unknown codes (not Spanish)', () => {
    const quick = getQuickReplies('xx');
    expect(quick[0]).toMatch(/park|sunny|say/i);
    expect(quick[0]).not.toMatch(/parque/i);
  });
});
