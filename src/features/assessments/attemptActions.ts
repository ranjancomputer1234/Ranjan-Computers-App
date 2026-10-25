import type {AssessmentRepository} from '../../core/repositories';
import type {Attempt} from '../../core/types';

// The acknowledged revision, not the rendered revision, must be submitted.
export async function saveAttemptAnswer(repo: AssessmentRepository, attempt: Attempt, questionId: string, optionId: string): Promise<Attempt> {
  const saved = await repo.saveAnswer(attempt.id, questionId, optionId, attempt.revision);
  return {...attempt, revision: saved.revision, answers: {...attempt.answers, [questionId]: optionId}};
}

export function remainingSeconds(expiresAt: string | undefined, now: number): number | null {
  if (!expiresAt) return null;
  const deadline = Date.parse(expiresAt);
  return Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}
