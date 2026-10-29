import { millisecondsToWholeMinutes, localDayKey } from '../src/services/practiceTimeStorage';

describe('practiceTimeStorage helpers', () => {
  it('floors whole minutes', () => {
    expect(millisecondsToWholeMinutes(59_999)).toBe(0);
    expect(millisecondsToWholeMinutes(60_000)).toBe(1);
    expect(millisecondsToWholeMinutes(125_000)).toBe(2);
  });

  it('formats local day key', () => {
    const key = localDayKey(new Date(2026, 5, 15, 23, 30));
    expect(key).toBe('2026-06-15');
  });
});

describe('review success rate display', () => {
  function formatRate(rate: number | null): string {
    if (rate == null) return '—';
    return `${Math.round(rate * 100)}%`;
  }

  it('shows dash when null and percent otherwise', () => {
    expect(formatRate(null)).toBe('—');
    expect(formatRate(0.7)).toBe('70%');
  });
});
