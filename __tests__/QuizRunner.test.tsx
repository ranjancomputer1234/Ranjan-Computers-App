import React from 'react';
import {render, screen, fireEvent, waitFor, act} from '@testing-library/react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {RepositoryContext} from '../src/core/di';
import {createHttpRepositories} from '../src/core/api/httpRepositories';
import {QuizRunner} from '../src/screens/assessments/QuizRunner';
import {remainingSeconds} from '../src/features/assessments/attemptActions';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({replace: jest.fn(), goBack: jest.fn()}),
  useRoute: () => ({params: {attemptId: 'attempt-test'}}),
  usePreventRemove: jest.fn(),
}));
jest.mock('../src/components/layout/Screen', () => ({
  Screen: ({children}: {children: React.ReactNode}) => <>{children}</>,
  StickyActionFooter: ({children}: {children: React.ReactNode}) => <>{children}</>,
  DetailHeader: () => null,
}));

async function setup(saveAnswer: jest.Mock<Promise<{revision: number}>>, formal = true) {
  const repos = createHttpRepositories();
  repos.assessments.attempt = jest.fn(async () => ({
    id: 'attempt-test', testId: 'test', status: 'in_progress' as const, revision: 3,
    currentIndex: 0, answers: {}, startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    questions: [{id: 'q1', prompt: 'Choose the answer', options: [{id: 'a', label: 'Answer A'}, {id: 'b', label: 'Answer B'}], revealAnswer: true, correctOptionId: 'b'}],
  }));
  repos.assessments.saveAnswer = saveAnswer;
  repos.assessments.submit = jest.fn(async () => ({attemptId: 'attempt-test', testId: 'test', score: 1, maxScore: 1, percent: 100, questions: [], solutionsAvailable: false}));
  const client = new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}});
  await render(<QueryClientProvider client={client}><RepositoryContext.Provider value={repos}><QuizRunner formal={formal} /></RepositoryContext.Provider></QueryClientProvider>);
  return repos;
}

it('waits for the final answer and submits its acknowledged revision', async () => {
  let acknowledge!: (value: {revision: number}) => void;
  const save = jest.fn(() => new Promise<{revision: number}>(resolve => { acknowledge = resolve; }));
  const repos = await setup(save);
  await screen.findByText('Answer A');
  await fireEvent.press(screen.getByText('Answer A'));
  await fireEvent.press(screen.getByText('Submit answers'));
  await waitFor(() => expect(save).toHaveBeenCalledWith('attempt-test', 'q1', 'a', 3));
  expect(repos.assessments.submit).not.toHaveBeenCalled();
  expect(screen.queryByText('Not quite')).toBeNull();
  await act(async () => { acknowledge({revision: 4}); });
  await waitFor(() => expect(repos.assessments.submit).toHaveBeenCalledWith('attempt-test', 4));
});

it('keeps the final selection retryable when saving fails', async () => {
  const repos = await setup(jest.fn(async () => { throw new Error('Connection lost'); }));
  await screen.findByText('Answer A');
  await fireEvent.press(screen.getByText('Answer A'));
  await fireEvent.press(screen.getByText('Submit answers'));
  await screen.findByText('Connection lost');
  expect(repos.assessments.submit).not.toHaveBeenCalled();
  expect(screen.getByText('Submit answers')).toBeTruthy();
});

it('reveals daily quiz feedback before finishing the attempt', async () => {
  const save = jest.fn(async () => ({revision: 4}));
  const repos = await setup(save, false);
  await screen.findByText('Answer A');
  await fireEvent.press(screen.getByText('Answer A'));
  await fireEvent.press(screen.getByText('Check answer'));
  await screen.findByText('Good try — keep going.');
  expect(screen.getByText('The correct answer is Answer B.')).toBeTruthy();
  expect(repos.assessments.submit).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Finish quiz'));
  await waitFor(() => expect(repos.assessments.submit).toHaveBeenCalledWith('attempt-test', 4));
});

it('calculates countdown from the deadline and never goes negative', () => {
  expect(remainingSeconds('2026-09-14T10:01:00Z', Date.parse('2026-09-14T10:00:30Z'))).toBe(30);
  expect(remainingSeconds('2026-09-14T10:01:00Z', Date.parse('2026-09-14T10:05:30Z'))).toBe(0);
  expect(remainingSeconds(undefined, Date.now())).toBeNull();
});
