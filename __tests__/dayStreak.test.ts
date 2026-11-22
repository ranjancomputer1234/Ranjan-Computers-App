import {currentStreak, mergeActiveDay, previousDayKey} from '../src/features/profile/dayStreak';

describe('day streak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-11-20', '2026-11-21', '2026-11-22'], '2026-11-22')).toBe(3);
  });

  it('keeps yesterday’s streak until today is missed', () => {
    expect(currentStreak(['2026-11-20', '2026-11-21'], '2026-11-22')).toBe(2);
  });

  it('resets after a missed day', () => {
    expect(currentStreak(['2026-11-18', '2026-11-19'], '2026-11-22')).toBe(0);
    expect(currentStreak(['2026-11-19', '2026-11-22'], '2026-11-22')).toBe(1);
  });

  it('ignores invalid dates and duplicates', () => {
    expect(currentStreak(['nope', '2026-11-22', '2026-11-22'], '2026-11-22')).toBe(1);
    expect(currentStreak([], '2026-11-22')).toBe(0);
  });

  it('steps across month and leap-day boundaries', () => {
    expect(previousDayKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDayKey('2024-03-01')).toBe('2024-02-29');
    expect(currentStreak(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01')).toBe(3);
  });

  it('records today once and keeps the newest days', () => {
    expect(mergeActiveDay(['2026-11-21', 'bad', '2026-11-21'], '2026-11-22')).toEqual([
      '2026-11-21',
      '2026-11-22',
    ]);
    const many = Array.from({length: 5}, (_, index) => `2026-01-0${index + 1}`);
    expect(mergeActiveDay(many, '2026-01-06', 3)).toEqual(['2026-01-04', '2026-01-05', '2026-01-06']);
  });
});
