/**
 * Documents Library list query construction expected by VocabularyScreen.
 * Server receives q/state/sort/cursor; client must not invent starred filters.
 */

type FilterKey = 'all' | 'new' | 'learning' | 'review' | 'difficult' | 'mastered';

function buildListParams(input: {
  filter: FilterKey;
  sort: 'created_at' | 'phrase' | 'next_review_at';
  q: string;
  cursor?: string;
}) {
  const trimmed = input.q.trim();
  return {
    limit: 100,
    sort: input.sort,
    state: input.filter === 'all' ? undefined : input.filter,
    q: trimmed || undefined,
    cursor: input.cursor,
  };
}

describe('vocabulary list params', () => {
  it('passes server q and omits empty search', () => {
    expect(buildListParams({ filter: 'all', sort: 'phrase', q: '  hello  ' }).q).toBe(
      'hello',
    );
    expect(buildListParams({ filter: 'all', sort: 'phrase', q: '   ' }).q).toBeUndefined();
  });

  it('maps learning-state filters only (no starred)', () => {
    expect(buildListParams({ filter: 'learning', sort: 'created_at', q: '' }).state).toBe(
      'learning',
    );
    expect(buildListParams({ filter: 'all', sort: 'created_at', q: '' }).state).toBeUndefined();
  });

  it('keeps pagination cursor while searching', () => {
    const params = buildListParams({
      filter: 'all',
      sort: 'created_at',
      q: '100%',
      cursor: 'abc',
    });
    expect(params.q).toBe('100%');
    expect(params.cursor).toBe('abc');
  });
});

describe('vocabulary detail validation', () => {
  const MAX_SHORT = 500;
  const MAX_LONG = 2000;

  function validate(fields: {
    translation: string;
    pronunciation: string;
    exampleSentence: string;
    note: string;
  }) {
    const errors: Record<string, string> = {};
    if (fields.translation.length > MAX_SHORT) errors.translation = 'too long';
    if (fields.pronunciation.length > MAX_SHORT) errors.pronunciation = 'too long';
    if (fields.exampleSentence.length > MAX_LONG) errors.exampleSentence = 'too long';
    if (fields.note.length > MAX_LONG) errors.note = 'too long';
    return errors;
  }

  it('rejects over-limit fields', () => {
    expect(
      validate({
        translation: 'x'.repeat(501),
        pronunciation: '',
        exampleSentence: '',
        note: '',
      }).translation,
    ).toBe('too long');
    expect(
      validate({
        translation: '',
        pronunciation: '',
        exampleSentence: 'y'.repeat(2001),
        note: '',
      }).exampleSentence,
    ).toBe('too long');
  });

  it('allows empty editable fields', () => {
    expect(
      Object.keys(
        validate({
          translation: '',
          pronunciation: '',
          exampleSentence: '',
          note: '',
        }),
      ),
    ).toHaveLength(0);
  });
});
