import {
  isPracticeTopic,
  normalizePracticeContext,
  sanitizeScenario,
} from '../src/features/chat/practiceContext';

describe('practiceContext', () => {
  it('validates practice topics', () => {
    expect(isPracticeTopic('grammar')).toBe(true);
    expect(isPracticeTopic('travel')).toBe(true);
    expect(isPracticeTopic('other')).toBe(false);
  });

  it('truncates scenario length', () => {
    const long = 'x'.repeat(200);
    expect(sanitizeScenario(long)?.length).toBe(120);
  });

  it('drops invalid topic and keeps source', () => {
    const normalized = normalizePracticeContext({
      topic: 'nope' as never,
      scenario: '  Hotel check-in  ',
      initialPrompt: 'Hello',
      source: 'home_recommendation',
    });
    expect(normalized?.topic).toBeUndefined();
    expect(normalized?.scenario).toBe('Hotel check-in');
    expect(normalized?.source).toBe('home_recommendation');
  });
});
