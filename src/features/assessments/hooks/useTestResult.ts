import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {accountKey} from '../../../core/session';
import type {ResultQuestion, ResultSection, TestResult} from '../../../core/types';

export type ResultFilter = 'All' | 'Correct' | 'Wrong' | 'Skipped';

export type PerformanceBand = 'excellent' | 'strong' | 'building' | 'starting';

export function performanceBand(percent: number): PerformanceBand {
  const safePercent = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  if (safePercent >= 85) return 'excellent';
  if (safePercent >= 70) return 'strong';
  if (safePercent >= 50) return 'building';
  return 'starting';
}

export function formatDuration(seconds?: number) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return undefined;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

export function formatRank(rank?: number, rankTotal?: number) {
  if (rank == null) return undefined;
  const left = rank.toLocaleString('en-IN');
  if (rankTotal == null) return `Rank ${left}`;
  return `Rank ${left} / ${rankTotal.toLocaleString('en-IN')}`;
}

export function formatStanding(rank?: number, rankTotal?: number) {
  if (rank == null || rankTotal == null || rank <= 0 || rankTotal <= 0) return undefined;
  const topPercent = Math.max(1, Math.min(100, Math.ceil((rank / rankTotal) * 100)));
  return `Top ${topPercent}%`;
}

export function calculateAccuracy(questions: ResultQuestion[]) {
  const correct = questions.filter(item => item.status === 'correct').length;
  const attempted = questions.filter(item => item.status !== 'skipped').length;
  return attempted ? Math.round((correct / attempted) * 100) : undefined;
}

export function questionSection(question: ResultQuestion) {
  return question.section?.trim() || undefined;
}

export function filterResultQuestions(
  questions: ResultQuestion[],
  filter: ResultFilter,
  section?: string,
) {
  return questions.filter(question => {
    if (filter !== 'All' && question.status !== filter.toLowerCase()) return false;
    if (section && questionSection(question) !== section) return false;
    return true;
  });
}

export function focusSection(sections?: ResultSection[]) {
  if (!sections?.length) return undefined;
  return [...sections].sort((a, b) => a.score / Math.max(1, a.max) - b.score / Math.max(1, b.max))[0];
}

export function strongestSection(sections?: ResultSection[]) {
  if (!sections?.length) return undefined;
  return [...sections].sort((b, a) => a.score / Math.max(1, a.max) - b.score / Math.max(1, b.max))[0];
}

export function useTestResult(attemptId: string) {
  const repos = useRepositories();
  const [filter, setFilter] = useState<ResultFilter>('All');
  const [sectionFilter, setSectionFilter] = useState<string | undefined>();
  const result = useQuery({
    queryKey: queryKeys.result(accountKey(), attemptId),
    queryFn: () => repos.assessments.result(attemptId),
  });
  const data = result.data;
  const test = useQuery({
    queryKey: queryKeys.test(data?.testId ?? ''),
    queryFn: () => repos.assessments.test(data!.testId),
    enabled: Boolean(data?.testId),
  });
  const questions = useMemo(
    () => filterResultQuestions(data?.questions ?? [], filter, sectionFilter),
    [data?.questions, filter, sectionFilter],
  );
  const counts = useMemo(() => {
    const list = data?.questions ?? [];
    return {
      all: list.length,
      correct: list.filter(item => item.status === 'correct').length,
      wrong: list.filter(item => item.status === 'wrong').length,
      skipped: list.filter(item => item.status === 'skipped').length,
    };
  }, [data?.questions]);
  const testTitle = data?.testTitle ?? test.data?.title;
  const accuracy = data?.accuracy ?? calculateAccuracy(data?.questions ?? []);
  return {
    result,
    data,
    testTitle,
    filter,
    setFilter,
    sectionFilter,
    setSectionFilter,
    questions,
    counts,
    weakest: focusSection(data?.sections),
    strongest: strongestSection(data?.sections),
    rankLabel: formatRank(data?.rank, data?.rankTotal),
    standingLabel: formatStanding(data?.rank, data?.rankTotal),
    timeLabel: formatDuration(data?.timeTakenSeconds),
    accuracy,
  };
}

export type {TestResult};
