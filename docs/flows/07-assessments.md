# 7. Assessments

## Entry

Exam detail or test list → Instructions (counts, duration, marking, resume, solutions — from server/fixtures, not invented locally).

Guest + start → login with pending `test` ref.

Paid locked test → Checkout with that product id.

## Attempt

1. `POST /tests/{id}/attempts` returns attempt id, questions, `expiresAt`, `revision`.
2. Persist attempt id locally enough to resume.
3. Save answer: option **ids** + revision (`PUT .../answers/{questionId}`).
4. Timer display uses `expiresAt`. The clock on device is not the authority.
5. Practice (`DailyQuiz`): may reveal correct/incorrect after answer.
6. Formal (`TestRunner`): no live correctness.
7. Submit is atomic. Duplicate submit returns the existing result.
8. Retry starts a **new** attempt.

## Navigation

Practice and formal runners are **root** screens (no tabs), matching focused test UX.

Result opens My Learning → Test Result.

## Mock

Daily quiz OTP-unrelated. Fixture test ids: `test-daily-quiz`, `test-banking-mock-1`, `test-banking-quant` (paid).
