import {
  calculateAccuracy,
  filterResultQuestions,
  focusSection,
  formatDuration,
  formatRank,
  formatStanding,
  performanceBand,
} from '../src/features/assessments/hooks/useTestResult';
import type {ResultQuestion} from '../src/core/types';

const questions: ResultQuestion[] = [
  {id: '1', prompt: 'A', status: 'correct', section: 'Quant'},
  {id: '2', prompt: 'B', status: 'wrong', section: 'English'},
  {id: '3', prompt: 'C', status: 'skipped', section: 'Quant'},
];

describe('test result helpers', () => {
  it('formats duration as minutes and seconds', () => {
    expect(formatDuration(3250)).toBe('54m 10s');
    expect(formatDuration(240)).toBe('4m 00s');
    expect(formatDuration(undefined)).toBeUndefined();
  });

  it('formats rank with Indian grouping', () => {
    expect(formatRank(1204, 12850)).toBe('Rank 1,204 / 12,850');
    expect(formatRank(42)).toBe('Rank 42');
    expect(formatStanding(1204, 12850)).toBe('Top 10%');
    expect(formatStanding(undefined, 12850)).toBeUndefined();
  });

  it('derives a safe performance band and fallback accuracy', () => {
    expect(performanceBand(92)).toBe('excellent');
    expect(performanceBand(70)).toBe('strong');
    expect(performanceBand(49)).toBe('starting');
    expect(calculateAccuracy(questions)).toBe(50);
  });

  it('filters questions by status and section', () => {
    expect(filterResultQuestions(questions, 'Wrong').map(q => q.id)).toEqual(['2']);
    expect(filterResultQuestions(questions, 'All', 'Quant').map(q => q.id)).toEqual(['1', '3']);
  });

  it('picks the weakest section for focus', () => {
    expect(
      focusSection([
        {name: 'English', score: 9, max: 10},
        {name: 'Quant', score: 6, max: 10},
      ])?.name,
    ).toBe('Quant');
  });
});
