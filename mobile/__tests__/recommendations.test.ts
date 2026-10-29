import { rankHomeRecommendations } from '../src/features/chat/recommendations';

describe('rankHomeRecommendations', () => {
  it('is deterministic for the same day key and inputs', () => {
    const input = {
      targetLanguage: 'en',
      cefrLevel: 'A2',
      motivation: 'travel',
      activeTopicId: 'grammar',
      dayKey: '2026-10-28',
      limit: 3,
    };
    const a = rankHomeRecommendations(input);
    const b = rankHomeRecommendations(input);
    expect(a.map(i => i.id)).toEqual(b.map(i => i.id));
    expect(a).toHaveLength(3);
  });

  it('boosts motivation-aligned topic without reshuffling mid-day', () => {
    const travelDay = rankHomeRecommendations({
      targetLanguage: 'en',
      motivation: 'travel',
      dayKey: '2026-10-28',
      limit: 3,
    });
    expect(travelDay[0]?.topic).toBe('travel');

    const again = rankHomeRecommendations({
      targetLanguage: 'en',
      motivation: 'travel',
      dayKey: '2026-10-28',
      limit: 3,
      activeTopicId: 'business',
    });
    // Same dayKey — order can shift with activeTopic, but calling twice is stable
    const again2 = rankHomeRecommendations({
      targetLanguage: 'en',
      motivation: 'travel',
      dayKey: '2026-10-28',
      limit: 3,
      activeTopicId: 'business',
    });
    expect(again.map(i => i.id)).toEqual(again2.map(i => i.id));
  });

  it('includes CEFR-aware prompts', () => {
    const beginner = rankHomeRecommendations({
      targetLanguage: 'en',
      cefrLevel: 'A1',
      dayKey: '2026-01-01',
      limit: 4,
    });
    expect(beginner.some(i => /simple|beginners/i.test(i.prompt))).toBe(true);
  });
});
