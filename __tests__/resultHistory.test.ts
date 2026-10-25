import {
  filterResultHistory,
  resultBand,
  summarizeResults,
} from '../src/features/assessments/resultHistory';
import type {TestResult} from '../src/core/types';

const result = (attemptId: string, percent: number): TestResult => ({
  attemptId,
  testId: `test-${attemptId}`,
  score: percent,
  maxScore: 100,
  percent,
  questions: [],
  solutionsAvailable: true,
});

describe('result history helpers', () => {
  const results = [result('one', 82), result('two', 58), result('three', 91)];

  it('summarizes attempts, average and best score', () => {
    expect(summarizeResults(results)).toEqual({attempts: 3, average: 77, best: 91});
    expect(summarizeResults([])).toEqual({attempts: 0, average: 0, best: 0});
  });

  it('filters strong attempts and attempts needing focus', () => {
    expect(filterResultHistory(results, 'strong').map(item => item.attemptId)).toEqual(['one', 'three']);
    expect(filterResultHistory(results, 'focus').map(item => item.attemptId)).toEqual(['two']);
  });

  it('labels score bands', () => {
    expect(resultBand(90)).toBe('Excellent');
    expect(resultBand(70)).toBe('Strong');
    expect(resultBand(50)).toBe('Building');
    expect(resultBand(49)).toBe('Needs focus');
  });
});
