# System and product flows

Every user journey and internal process. Backend-owned steps are marked **server**. Mobile-owned steps are marked **app**.

## 1. Bootstrap

1. App process starts → `AppRoot` providers (gesture, safe area, Query, repositories).
2. `status = bootstrapping` (blank spinner, no Login/Home flash).
3. Keychain restore. Temporary network failure is **not** treated as logout.
4. Tokens present → `authenticated`. None + `guestMode` → `guest`. Else → `loggedOut` (Login).
5. Query online manager binds NetInfo; focus manager binds AppState.

## 2. Authentication

**Login:** validate phone/password (Zod) → `POST /auth/login` → Keychain tokens → `authenticated` → Main tabs. Passwords are never logged.

**Guest:** `enterGuest` sets preference, no fake user, no Deepak profile.

**Register:** fields → challenge → OTP (`123456` in mock) → session.

**Forgot/reset:** phone → challenge → new password → Login.

**Google:** native token **must** be exchanged with REDI. If client IDs are missing, UI states unavailable. Native Google success alone is not a session.

**Protected action while guest:** store `ContentRef` → `showLogin()` → after login, re-check access. Login does **not** auto-pay or auto-submit a test.

**Logout:** bump session generation, wipe Keychain, remove private queries, stop treating downloads as unlocked, return to Login.

**401:** single-flight refresh. Revoked refresh → logout. Timeout → offline, keep credentials.

## 3. Discovery and search

Home sections load independently enough that a failed banner does not blank Explore.

Free/Paid home controls open Computer Courses with the matching chip.

See All → Explore Sections (includes Interview Prep).

Search debounces 300ms, keys include the query, recents are account-scoped and not logged. Microphone is unavailable unless configured.

Result kinds route only through the typed target map.

## 4. Free learning

Catalogue → Course Detail → enroll if required → Lesson Player → progress POST (throttled) → complete (server) → My Learning.

Guests can browse public catalogue. Enrollment/progress requires auth.

## 5. Paid learning / checkout

1. Recheck entitlement.
2. Authoritative quote (coupon recalculates totals).
3. Create/recover order with idempotency key (persisted per account).
4. `PaymentService.launch` (mock success in dev).
5. Backend verify. UI shows success only after `succeeded`.
6. If paid but access pending → Payment Pending, refresh, no second charge.
7. Cancellation ≠ failure.

States: `idle → creatingOrder → awaitingProvider → verifying → paidAccessPending | succeeded | cancelled | failed | unknownNeedsRecheck`.

## 6. Assessments

Instructions from server (counts, duration, marking, resume, solutions).

Create attempt → persist id + deadline → save answers with option ids and revision.

Timer uses `expiresAt`, not a naive JS decrement as authority.

Practice may reveal correctness; formal tests do not.

Submit is atomic; duplicate submit returns the existing result. Retry starts a **new** attempt.

## 7. Semesters

Progress, tests, projects, and admin review are separate facts.

Available semester → content. Locked semester explains why and refuses deep links.

When requirements complete → `submit-review` if the contract needs it → Wait screen.

**App cannot unlock.** Approval notification is a refetch signal only.

Rejected → show feedback + resubmit path.

## 8. Live classes

Schedule queries the selected day (timezone-aware). Count = returned live rows.

Join authorized session → native player. Chalkboard is poster only.

Chat: pending/fail, client correlation ids. Raise hand is an API flag, not a mic grant.

Ended + recording → watch. Cancelled/not live → honest state.

## 9. News, awareness, facts, interview

Premium bodies require entitlement before fetch.

Topics use schema variants (pairs/list/article). States & Capitals search matches label **and** value.

Facts reactions are idempotent with query invalidation. Quiz starts only if `quizId` exists.

Mock Interview 1-on-1 is a product CTA, not a booking/AI system.

## 10. Downloads and uploads

Authorize → queue (queued/downloading/paused/failed/expired). Usage is measured bytes.

Wi-Fi-only from Settings. Protected DRM is **not** claimed.

Avatar/project upload: validate, progress, then API complete. Upload ≠ accepted project.

## 11. Notifications and documents

Inbox is source of truth; push is optional.

Open → mark read → resolve typed target after access check.

Clear All confirms and uses API meaning (`mark_read` in mock).

Admit cards/certificates are read-only issued records. QR is the issued payload, not `redi.app/verify`. Revoked/not issued never show “verified”.

## 12. Profile and settings

Edit profile uses one submit path. Currently Learning cannot grant access.

Wi-Fi and dark preference are local. Streak freeze / subscription are capability-honest.

Language switch would load bundled UI strings; it does not pretend API English content is translated.

## 13. Error / offline / empty

Mapped in `docs/architecture.md` and `src/core/api/http.ts`. Offline keeps suitable cache. 403 shows the real restriction. 404 missing-content. 429 respects Retry-After when present. Non-idempotent POSTs are not blindly retried.
