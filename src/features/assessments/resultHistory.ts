import type {TestResult} from '../../core/types';

export type HistoryFilter = 'all' | 'strong' | 'focus';

export function summarizeResults(results: TestResult[]) {
  if (!results.length) return {attempts: 0, average: 0, best: 0};
  const percentages = results.map(item => Math.max(0, Math.min(100, item.percent)));
  return {
    attempts: results.length,
    average: Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length),
    best: Math.round(Math.max(...percentages)),
  };
}

export function filterResultHistory(results: TestResult[], filter: HistoryFilter) {
  if (filter === 'strong') return results.filter(item => item.percent >= 70);
  if (filter === 'focus') return results.filter(item => item.percent < 70);
  return results;
}

export function resultBand(percent: number) {
  if (percent >= 85) return 'Excellent';
  if (percent >= 70) return 'Strong';
  if (percent >= 50) return 'Building';
  return 'Needs focus';
}
