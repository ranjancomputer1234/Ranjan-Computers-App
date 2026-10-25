# REDI Admin Panel and Backend API Handover

> **Product:** REDI — Ranjan Educational Institute learner platform  
> **Mobile application:** React Native app, package `com.rediapp.learner`  
> **Audience:** product owner, backend team, admin-web team, QA, DevOps, security, and support  
> **Baseline audited:** 2026-10-01  
> **Contract status:** proposed from the implemented mobile client; no live REDI backend, admin portal, OpenAPI file, provider accounts, or production credentials were supplied  
> **Requirement language:** `MUST`, `SHOULD`, and `MAY` indicate priority

---

## 1. Purpose and handover status

This is the single implementation handover for the backend API and the web admin panel that must support the existing REDI learner app. It records:

- what the learner app already does;
- what data the app expects;
- every learner-facing HTTP operation currently wired in code;
- the admin modules needed to operate that data;
- roles, permissions, workflows, state transitions, validation, security, reporting, and release requirements;
- current limitations and decisions that still require product or provider confirmation.

The mobile app already contains both mock repositories and an HTTP repository adapter. Development builds use mock data unless explicitly configured for API mode. Release builds use API mode. The HTTP paths and DTOs in this document are therefore a **proposed compatibility contract** derived from the app, not proof of a deployed backend.

### 1.1 Delivery ownership

| Area | Owner | Responsibility |
|---|---|---|
| Learner mobile app | Mobile team | UI, secure local token storage, local preferences, API consumption, native billing/push/download adapters |
| REDI API | Backend team | Authentication, authorization, authoritative business state, validation, scoring, entitlements, payments, documents, media authorization, audit |
| Admin web | Admin-web team | Safe staff workflows over admin APIs; never direct database writes |
| Background workers | Backend/DevOps | notifications, exports, media processing, document generation, ranking, reconciliation, scheduled publication |
| Object storage/CDN | Backend/DevOps | private media, signed URLs, upload scanning, retention |
| External providers | Integration owners | Google sign-in, Play/App Store billing, FCM/APNs, email/SMS/OTP, live video |

### 1.2 Non-negotiable source-of-truth rules

- The API is authoritative for identity, access, price, entitlement, enrollment, progress totals, attempts, scores, rank, semester unlock, payment state, and issued documents.
- The app may cache and optimistically render, but it MUST NOT grant paid access, approve semesters, calculate final ranks, mark a payment successful, or issue documents.
- Stable server IDs MUST survive renames and reordering. Titles are not identifiers.
- Push is a delivery channel; the backend notification inbox is the durable record.
- Sensitive media MUST use short-lived playback/download authorization. Do not return permanent public URLs.
- Every high-impact admin mutation MUST record actor, time, reason, request ID, and before/after values.
- Admin-web authorization MUST be enforced again by the API. Hidden buttons are not access control.

---

## 2. Current mobile application baseline

### 2.1 Technology and runtime behavior

| Concern | Current implementation |
|---|---|
| Framework | React Native 0.87.1, React 19.2.3, TypeScript |
| Navigation | React Navigation; five tabs plus focused root flows |
| Server state | TanStack Query; 60-second default stale time, 30-minute garbage collection |
| Local state | Zustand and AsyncStorage preferences |
| Secure tokens | `react-native-keychain`, device-only while unlocked |
| HTTP | Axios, 15-second timeout, bearer access token, one coordinated refresh attempt after 401 |
| Validation | Zod plus screen-specific validation |
| Media | `react-native-video`; provider contract not finalized |
| Downloads | Protected PDF download to app-private storage; optional SHA-256 and offline expiry |
| Push | Android FCM when `google-services.json` is present; otherwise in-app inbox only |
| Payments | Mock in development; Google Play Billing route on Android production; iOS route declared but not implemented in this repository |
| Languages | English and Hindi UI preferences; API content remains in its publication language |
| Theme | Light/dark local preference |

### 2.2 App areas and screens the backend/admin must support

| Area | Learner surfaces | Backend/admin responsibility |
|---|---|---|
| First run | Onboarding, learning goal, language, guest entry | Optional remote defaults; app currently stores these locally |
| Authentication | Login, register, verify contact, forgot/reset password, Google exchange, logout | Accounts, challenges, sessions, refresh rotation, verification, abuse controls |
| Home | Greeting, search, free/paid learning, live highlights, Continue Learning, Explore, notification count | Home composition, access-aware cards, app config, banners, stable targets |
| Catalogues | Computer courses, exams, news, awareness, facts, interview prep | Publishable catalogues, ordering, pricing/access, search indexing |
| Learning | Course detail, lessons, player, resources, enrollments, bookmarks, downloads | Curriculum, media authorization, progress, completion, entitlements |
| Assessments | Test list/instructions, daily quiz, formal runner, result, review, history | Test versions, attempt snapshots, revisions, atomic submit, scoring, rank, solutions |
| Semester programs | Outline, semester content, project, review wait | Prerequisites, projects, submissions, reviewer decisions, next-semester unlock |
| Live | Schedule, room, reminder, hand raise, chat, recording | Schedule, provider join token, host controls, attendance, moderation, recording |
| Editorial | News, general awareness, facts, reactions, interview questions | Authoring, review, publish schedule, premium access, localization |
| Commerce | Checkout, success/failure/pending, history, order detail | Products, quote, coupons, idempotent orders, verification, reconciliation, entitlements |
| Account | Profile/edit, settings, notifications, documents, support, feedback, legal, deletion | Profile, inbox, preferences where synchronized, documents, legal versions, privacy requests |

### 2.3 Registered navigation inventory

The backend must preserve target IDs for these destinations because notifications, bookmarks, search, and pending-login navigation depend on them.

- Root/public: `Onboarding`, `Login`, `Register`, `ForgotPassword`, `VerifyContact`, `ResetPassword`, `PublicLegal`.
- Root/authenticated focus flows: `DailyQuiz`, `TestRunner`, `Checkout`, `PaymentSuccess`, `PaymentFailure`, `PaymentPending`, `SemesterWait`.
- Tabs: Home, Live, Courses, My Learning, Profile.
- Discovery/detail: Search, Notifications, Computer Courses, Competitive Exams, Daily News, General Awareness, Amazing Facts, Interview Prep, Explore Sections, Course Detail, Lesson Player, Exam Detail, Test List, Test Instructions, News Feed, News Article, Topic Detail, Facts List, Fact Detail, Interview Question/List, Live Room.
- Learning/account: Downloads, Semester Outline/Content, Project Detail, Test Result, Result History, Enrolled Courses, Document List, Admit Card, Certificate, Settings, Notification Settings, Edit/Delete Account, Help & Support, About, Feedback, Legal, Payment History, Order Detail, Subscription.

### 2.4 Capability truth and current limitations

These must remain honest until the corresponding backend/provider is delivered:

- Google login is shown only when a client ID is configured, and its ID token must still be exchanged with REDI.
- Voice search is disabled; no native speech adapter is configured.
- Live chat is deliberately disabled by mobile configuration even if a join response says chat is available.
- FCM activates only when Firebase native configuration is installed.
- Only PDF resources are saved offline in the current build; generic offline video is excluded pending DRM/licensing.
- Feedback opens a configured support email client; it does not create a backend ticket today.
- The Subscription screen explicitly says recurring billing is not a live product. Current commerce is one-time purchase.
- Course written reviews and some exam video content are incomplete product surfaces.
- Mock data is development-only and must never be returned as fallback after an API error.

---

## 3. Target architecture

### 3.1 Deployable components

1. **Admin Web** — responsive TypeScript web app using server-managed sessions.
2. **REDI API** — versioned learner and admin HTTP APIs.
3. **Relational database** — authoritative transactional records and audit history.
4. **Object storage/CDN** — private originals, processed variants, documents, resources, recordings.
5. **Job queue/workers** — scheduled publishing, fan-out, exports, scoring/ranking, document creation, media processing, reconciliation.
6. **Realtime gateway/provider** — live room signals/chat/attendance where enabled.
7. **Provider adapters** — identity, OTP, push, billing, live video, email/SMS.
8. **Observability** — structured logs, metrics, traces, alerts, dashboards, and error tracking.

### 3.2 Environments

Provide separate `development`, `staging`, and `production` environments with separate databases, storage buckets, provider credentials, signing secrets, admin identities, and base URLs. Staging must support sandbox payments and non-production notifications. Production data must never be copied into development without approved anonymization.

### 3.3 Recommended backend boundaries

- Identity and access
- Catalogue/content
- Learning/enrollment/progress
- Assessments/results
- Semester review/projects
- Live classes
- Commerce/entitlements
- Communications
- Documents
- Support/privacy/legal
- Reporting/audit/configuration

A modular monolith is acceptable for the first release if module ownership, database migrations, jobs, and interfaces remain explicit. Do not split into services merely to mirror this list.

---

## 4. Admin identity, roles, and permissions

### 4.1 Authentication requirements

- Admin authentication MUST be separate from learner authentication.
- Require organization email/password or SSO plus MFA for privileged roles.
- Use secure, `HttpOnly`, `Secure`, same-site cookies for admin sessions; do not store admin tokens in browser local storage.
- Support recovery codes, session listing, remote sign-out, idle timeout, absolute lifetime, forced reset, and account disablement.
- Rate-limit and alert on repeated failures. Audit successful and failed sign-ins, MFA events, recovery, and privilege changes.
- Re-authentication is required for refund approval, role changes, exports containing personal data, mass access changes, document revocation, and emergency override.

### 4.2 Default roles

| Role | Primary scope |
|---|---|
| Super Admin | Platform configuration, staff, roles, provider settings, emergency actions |
| Operations Admin | Learners, batches, enrollments, approvals, notifications, documents, operational reports |
| Academic Admin | Courses, semesters, projects, tests, results, approvals, certificates |
| Content Editor | Draft and edit assigned content/media; no publish by default |
| Reviewer/Publisher | Review, schedule, publish, unpublish, and roll back content |
| Instructor | Assigned courses/batches, live classes, attendance, learner progress |
| Exam Manager | Question bank, tests, windows, attempts, results, corrections, publication |
| Document Officer | Templates, eligibility, generation, issue, revoke, supersede |
| Support Agent | Learner timeline, cases, safe resend/recheck actions; limited mutations |
| Finance Manager | Products, coupons, orders, reconciliation, refund workflow, financial exports |
| Analyst | Read-only dashboards and approved de-identified exports |
| Auditor | Read-only audit, permissions, operational and financial history |

### 4.3 Permission keys

Use granular permission checks with optional branch/course/batch scope. Minimum groups:

```text
admins.read admins.manage roles.manage audit.read settings.manage
learners.read learners.update learners.suspend learners.export learners.safe_impersonate
batches.manage enrollments.create enrollments.revoke entitlements.grant entitlements.revoke
content.create content.edit content.review content.publish content.archive media.manage
explore.manage banners.manage legal.manage support.manage
assessments.author assessments.publish attempts.read results.read results.recompute results.override results.publish
semester.review semester.approve projects.review
live.schedule live.host live.moderate attendance.manage recordings.manage
notifications.send_single notifications.send_bulk notifications.approve notifications.cancel
documents.generate documents.issue documents.revoke
payments.read refunds.request refunds.approve reconciliation.manage
reports.read exports.create privacy.manage
```

### 4.4 Separation of duties

- Authors SHOULD NOT approve their own high-stakes test, legal text, document template, or high-priority broadcast.
- Large bulk sends, mass entitlement changes, result overrides, and document revocations require a reason and configurable second approval.
- Refund requester and approver must differ above a configured amount.
- Audit events are immutable, including for Super Admins.

---

## 5. Admin information architecture

```text
Dashboard
People
  Learners
  Batches / Cohorts
  Staff, Roles & Permissions
Learning
  Courses
  Semesters
  Lessons & Resources
  Projects & Reviews
Assessments
  Question Bank
  Tests & Windows
  Attempts
  Results & Rank Runs
Live Classes
Content
  Explore Sections
  Home Banners
  News
  General Awareness
  Amazing Facts
  Interview Preparation
Commerce
  Products & Pricing
  Coupons
  Orders & Payments
  Refunds & Reconciliation
Communications
  Notifications
  Templates
  Delivery Logs
Documents
  Certificates
  Admit Cards
  Templates & Verification
Support & Privacy
Reports & Exports
Audit Log
Settings & Feature Flags
```

Every list page MUST support permitted filters, server pagination, sortable allowlisted columns, shareable URLs, explicit loading/empty/error states, and export only when authorized. Destructive actions require named confirmation and impact preview.

---

## 6. Admin modules and detailed requirements

### 6.1 Dashboard

Show time-bounded, permission-aware metrics:

- active/new/suspended/deletion-requested learners;
- enrollments, active learners, course completion, and stalled progress;
- pending project and semester reviews with aging;
- tests live today, attempts in progress/expired/submitted, unpublished results;
- live classes today, join success, attendance, recordings pending;
- paid, failed, unknown, refund, chargeback, and entitlement-sync orders;
- scheduled/sending/failed notifications;
- documents eligible, queued, failed, issued, revoked;
- failed jobs/webhooks and provider degradation.

Cards link to pre-filtered work queues. All counts display their time zone and refresh time.

### 6.2 Learners, batches, and enrollments

Learner search: ID, name, normalized phone, email, batch, course, account state, verification, join date, last activity. Mask contact data unless permission allows full display.

Learner workspace tabs:

- identity, contacts, verification, consent, account state;
- enrollments, progress, bookmarks, download authorizations;
- test attempts/results/integrity flags;
- orders, payments, refunds, entitlements;
- projects and semester reviews;
- documents;
- notifications/devices/preferences;
- support/privacy requests and complete timeline.

Allowed actions include correct approved profile fields, resend verification, suspend/reactivate, revoke sessions, add/revoke enrollment or entitlement with reason, recheck payment, and process deletion. Admins can never view passwords, access tokens, card data, UPI PINs, or full provider secrets.

Batches require name/code, course, instructors, schedule/timezone, capacity, active dates, status, learner membership, and bulk-import validation with preview.

### 6.3 Shared content lifecycle

Managed content states:

```text
draft -> in_review -> approved -> scheduled -> published -> unpublished -> archived
```

- Store immutable versions for published content.
- Editing a published item creates a draft version; learners continue to receive the published version until approval.
- Preview must use the same DTO shape as the learner API.
- Scheduling uses UTC plus an explicit editorial timezone.
- Publishing validates required fields, target existence, access/product consistency, media readiness, and mobile compatibility.
- Archive instead of hard delete when referenced by bookmarks, attempts, enrollments, orders, notifications, or documents.

Media library requirements: upload, direct-to-storage signed upload, MIME/size validation, malware scan, metadata removal where required, processing states, thumbnails/transcoding, alt text/captions, usage references, replace-with-version, and safe archive.

### 6.4 Explore sections, home, banners, and app configuration

The app currently has stable section concepts for Computer Courses, Free Courses, Career Courses, Competitive Exams, Interview Prep, Daily News, General Awareness, and Amazing Facts.

Admin fields: stable ID, localized title/description, category (`learn`, `prepare`, `discover`), icon or image, clay/color presentation token, badge, metadata, destination kind/ID, optional pricing filter, search keywords, order, visibility, audience, start/end, minimum app version.

Home management must support:

- greeting and continue-learning inputs from learner state;
- live highlights;
- banners with image, accessibility text, placement, audience, schedule, priority, frequency cap, and safe target;
- Explore ordering/defaults while respecting the learner's locally selected learning goal;
- maintenance message, minimum/supported versions, feature flags, support contacts, legal versions, provider availability, and cache TTLs.

Renaming/reordering MUST NOT change stable IDs or break existing deep links.

### 6.5 Courses, curriculum, lessons, and resources

Course fields: stable ID/code, title/subtitle, description, outcomes, prerequisites, cover/icon, instructor, free/paid, product mapping, standard/semester type, level/language/tags, visibility, publish state, SEO/search fields, rating summary, learner count policy.

Curriculum builder:

- ordered modules/semesters and lessons;
- lesson title, index, duration, preview flag, completion rule, notes;
- video/audio/PDF/notes resources with MIME, size, download policy, captions, checksum, and license window;
- prerequisite graph validation and drag/reorder with optimistic concurrency;
- learner preview before publish.

Published changes must not invalidate active enrollments. Deleting a lesson with progress is forbidden; archive/version it. Progress adjustments are exceptional, reasoned, and audited.

### 6.6 Semester programs, projects, and approvals

Semester statuses required by mobile:

```text
locked available in_progress requirements_complete pending_review
changes_required approved course_complete
```

Configure lesson/test/project requirements, pass thresholds, sequence, unlock rule, estimated review SLA, certificate eligibility, and resubmission limits.

Projects require title, instructions, rubric version, accepted upload types/size, text/file policy, due date, and resubmission rule. Submission states include `not_started`, `draft`, `submitted`, `accepted`, and `changes_required`.

Review queue shows learner, course, semester, requirement checklist, latest submission, prior decisions, due/aging, and conflicts. Commands are explicit:

- approve project;
- request project changes with required feedback;
- approve semester and transactionally unlock the next semester;
- request semester changes;
- mark program complete and enqueue eligible certificate generation.

All commands are idempotent and use revision/ETag to prevent two reviewers overwriting one another.

### 6.7 Assessments and results

Question bank supports single-choice initially and is extensible to multiple-choice, numeric, text, and passage groups. Store prompt, helper, options, correct answer, explanation, subject/topic, difficulty, language, marks, negative marks, source, tags, lifecycle, and immutable revisions.

Test builder fields:

- stable ID, title, exam/course/semester association;
- mode `practice` or `formal`;
- ordered fixed questions or pool rules;
- question count and duration;
- pricing/product/access;
- instructions/marking/negative-marking display;
- pass threshold, attempt limit, resume policy;
- availability window and audience assignment;
- solution release policy and result publication policy.

Publish validation checks answer completeness, duplicate questions, count, marks, duration, access/product consistency, availability window, and solution policy.

Attempt states required by mobile:

```text
in_progress submitted scored expired abandoned
```

At start, snapshot the published test and questions. Answer saves use a monotonically increasing `revision`; stale revisions return conflict. Submit is atomic and idempotent, freezes answers, scores from the snapshot, and returns the same result on retry. Never expose correct answers before policy permits.

Result DTO includes score/max/percent, optional rank, rank total, accuracy, time, section scores, per-question status, selected/correct labels, explanation, and `solutionsAvailable`. Overrides create a new result revision, require reason/permission, and never mutate history invisibly.

### 6.8 Live classes

Configure title, course/batch/audience, instructor/host, start/end, timezone, provider, room policy, capacity, chat/hand/reminder/recording flags, join window, and recording publication.

Lifecycle:

```text
scheduled -> starting -> live -> ended
scheduled/live -> cancelled
live -> reconnecting -> live|ended
```

Learner `join` returns a short-lived authorized session, not a permanent room secret. Host console needs start/end, participant list, attendance, mute/remove, chat moderation, hand queue, reconnect health, and recording state. Store attendance intervals rather than only a boolean.

### 6.9 Editorial content

- **News:** category, title, byline, excerpt, body blocks, highlights, tags, hero image, featured flag, publish time, reading time, access/product.
- **General awareness:** topic, schema (`pairs`, `list`, `article`), summary chips, ordered entries with label/value/group/presentation metadata, access/product.
- **Facts:** category, fact text, explanation, featured flag, related quiz, reactions, bookmark-compatible stable ID.
- **Interview:** category, question prompt, model answer, access/product.
- **Search:** index only published, visible, authorized content; support course/exam/test/live/news/fact/topic/interview targets and remove archived content promptly.

Do not publish catalogue items with empty bodies unless the app is intended to show an explicit unavailable state.

### 6.10 Notifications

Categories required by mobile: `classes`, `tests`, `news`, `offers`, `system`. Target kinds: `course`, `lesson`, `test`, `news`, `fact`, `topic`, `interviewQuestion`, `interviewCategory`, `liveClass`, `document`, `exam`, `section`.

Composer fields: title, body, category, priority, action label, target, audience, schedule, expiry, inbox/push channels. Audience types: all, learner IDs, course, batch, saved segment. Before publish show resolved recipient count, exclusions, local delivery time, in-app preview, Android preview, and invalid target warnings.

Lifecycle: draft, awaiting approval, scheduled, sending, sent/partially sent, cancelled, failed. Resolve recipients immutably at approval/publish time. Create inbox rows and an outbox event in one transaction; workers fan out FCM in bounded idempotent batches.

Metrics: resolved, inbox-created, FCM accepted, invalid device, delivered where available, opened, read, opt-out, failure. `system` cannot be disabled but requires stronger send permission.

### 6.11 Products, checkout, payments, and entitlements

Product types may cover course, exam/test pack, content category, or future subscription, but recurring billing remains disabled until explicitly approved.

Store product ID, internal product ID, platform, price/currency, tax display, active dates, access duration, included content, store status, and entitlement mapping. Money is integer minor units plus ISO currency.

Coupon fields: code, fixed/percentage rule, cap, eligible products/audiences, start/end, total/per-user limits, combinability, status.

Order lifecycle expected by mobile:

```text
idle creatingOrder awaitingProvider verifying paidAccessPending
succeeded cancelled failed unknownNeedsRecheck
```

- Quote returns MRP, discount, coupon discount, total, currency, expiry, and allowed methods.
- Create order requires `Idempotency-Key` and freezes the quote.
- The provider/server, never the phone callback alone, verifies payment.
- Payment success and entitlement grant should be transactional or use a durable outbox with `paidAccessPending` until convergence.
- Store immutable provider events uniquely; support recheck, restore, reconciliation, refund/dispute, and entitlement correction.
- Never store card number, CVV, UPI PIN, or raw secrets.

### 6.12 Documents

Kinds: `admit_card`, `certificate`. Mobile statuses: `not_issued`, `issued`, `revoked`, `superseded`, `expired`.

Template versioning must include approved layout, fields, assets, signatures/seals, QR/verification payload, validity, and eligibility rules. Generation is a queued job; preview before bulk issue. Issue/revoke/supersede are explicit audited commands. Verification endpoints reveal only approved public fields and current status. A revoked/not-issued document must never display as verified.

### 6.13 Downloads and uploads

- Files are private by default.
- Upload using short-lived signed URLs, allowlisted MIME/extensions, size limits, malware scan, checksum, and quarantine/processing states.
- Download authorization validates learner, entitlement, resource policy, device/session as required, and returns HTTPS URL, URL expiry, optional offline expiry, and optional SHA-256.
- Current mobile only saves PDFs offline and requires valid future expiry. Video offline requires a DRM provider/license contract.
- Project submission must reference a finalized owned upload ID; the API must not accept arbitrary public URLs.

### 6.14 Support, feedback, legal, and privacy

Support configuration returns FAQ items and approved email/phone. A future case system should accept category (`bug`, `content`, `payment`, `other`), message, attachments, app/device context, status, assignee, SLA, and conversation history.

Legal documents require slug, locale, version, effective date, body, review/approval, and publication history. Preserve which version a learner accepted where consent is required.

Deletion requests require identity confirmation, cooling period if legally/product appropriate, export/retention handling, status, reviewer, and final audit. Revoking sessions and disabling future processing should occur promptly; retained financial/audit records must be minimized and documented.

---

## 7. Core domain model

Exact table names may differ, but do not hide authoritative state in unvalidated generic JSON.

### 7.1 Identity and access

`admin_users`, `admin_sessions`, `mfa_methods`, `roles`, `permissions`, `role_permissions`, `admin_roles`, `scope_assignments`, `learners`, `learner_contacts`, `learner_sessions`, `verification_challenges`, `external_identities`, `push_devices`, `notification_preferences`, `consents`, `privacy_requests`, `batches`, `batch_memberships`, `instructor_assignments`.

### 7.2 Catalogue and learning

`explore_sections`, `explore_section_versions`, `banners`, `banner_versions`, `courses`, `course_versions`, `modules`, `semester_definitions`, `lessons`, `lesson_versions`, `resources`, `media_assets`, `enrollments`, `entitlements`, `lesson_progress`, `bookmarks`, `download_authorizations`, `projects`, `project_rubric_versions`, `project_submissions`, `project_reviews`, `semester_progress`, `semester_reviews`.

### 7.3 Assessments

`questions`, `question_revisions`, `question_option_revisions`, `question_tags`, `tests`, `test_versions`, `test_sections`, `test_questions`, `test_pool_rules`, `test_windows`, `test_assignments`, `attempts`, `attempt_question_snapshots`, `attempt_answer_revisions`, `attempt_events`, `results`, `result_revisions`, `result_sections`, `result_questions`, `rank_runs`, `integrity_flags`.

### 7.4 Editorial and operations

`news_categories`, `news_articles`, `awareness_topics`, `awareness_entries`, `fact_categories`, `facts`, `fact_reactions`, `interview_categories`, `interview_questions`, `live_classes`, `live_rooms`, `live_participants`, `attendance_sessions`, `live_chat_messages`, `moderation_actions`, `recordings`, `notification_campaigns`, `notification_recipients`, `inbox_notifications`, `push_deliveries`, `notification_templates`.

### 7.5 Commerce, documents, and platform

`products`, `prices`, `coupons`, `coupon_redemptions`, `orders`, `payments`, `payment_events`, `refunds`, `document_templates`, `document_template_versions`, `document_eligibility`, `issued_documents`, `document_verification_events`, `support_cases`, `support_messages`, `legal_document_versions`, `audit_events`, `approval_requests`, `background_jobs`, `webhook_events`, `export_jobs`, `feature_flags`, `app_config_versions`.

### 7.6 Database rules

- Use UUID/ULID-style non-guessable IDs and separate human-readable codes.
- Add created/updated timestamps, actor IDs, status, and revision where relevant.
- Store timestamps in UTC and preserve source timezone for scheduled items.
- Enforce foreign keys, unique/check constraints, and transactional state transitions.
- Soft-archive referenced business records. Hard deletion is limited to safe drafts and retention jobs.
- Encrypt sensitive values at rest; hash lookup forms of push/provider identifiers where feasible.
- JSON is acceptable for controlled provider fragments or presentation metadata, not permissions, prices, scoring, or entitlement state.

---

## 8. API-wide contract

### 8.1 Transport and headers

- Base URLs are required for dev/staging/prod; learner adapter expects a base ending in `/v1` or equivalent.
- HTTPS only. JSON UTF-8. ISO-8601 timestamps with offset/UTC.
- Mobile sends `Accept: application/json`, `X-App-Platform: react-native`, `X-API-Version: v1`, and `Authorization: Bearer <accessToken>` when authenticated.
- Propagate `X-Request-Id` or return `requestId` in errors.
- Use `Idempotency-Key` on retryable commands such as order creation, sends, issue, approve, and bulk jobs.
- Use ETag/`If-Match` or body revision for high-conflict resources.

### 8.2 Success, pagination, and error shapes

Return the resource directly for non-paginated success because the mobile adapter currently reads `response.data` as the DTO.

```json
{
  "items": [],
  "nextCursor": null,
  "total": 0
}
```

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Please correct the highlighted fields.",
  "fieldErrors": {"phone": ["Phone is already registered."]},
  "requestId": "req_01..."
}
```

The app treats network errors, timeouts, and 5xx as retryable and does not automatically retry 4xx. Return `Retry-After` for 429. Recommended status use: 400 malformed, 401 unauthenticated/refresh invalid, 403 authenticated but denied, 404 absent/hidden, 409 state or revision conflict, 410 expired/revoked, 422 semantic validation, 429 limited, 5xx transient server/provider failure.

### 8.3 Authentication/session behavior

- Access tokens are short-lived; refresh tokens are rotated and stored server-side as revocable hashed records.
- On a normal 401 the app calls `POST /auth/refresh` once with the refresh token, stores the returned token set, and retries the original request.
- A 401/403 from refresh means revoked session and signs the learner out. A transient refresh outage must not be reported as revocation.
- Logout revokes at least the current refresh-token family. Password reset/suspension should support revoking all sessions.
- Login/register/reset/challenge endpoints require rate limiting, enumeration-resistant responses, OTP expiry/attempt limits, and abuse telemetry.

### 8.4 Canonical shared DTO rules

- `EntityId`: opaque string.
- `Money`: `{amountMinor: integer, currency: string}`.
- `AccessDecision`: `{state: unknown|granted|denied, reason?, productId?, expiresAt?, canPreview, canDownload}`.
- Access reasons: `login_required`, `purchase_required`, `prerequisite_required`, `verification_pending`, `expired`, `revoked`, `unavailable`.
- `LearningProgress`: completed/total lessons, integer percent 0–100, optional next lesson/last position, update timestamp.
- Content target kinds are exactly those listed in Section 6.10 unless mobile is released with a new type.
- Presentation `clay` values currently supported: `blue`, `green`, `orange`, `pink`, `purple`, `yellow`, `mint`, `lavender`, `cyan`, `peach`, `cream`, `beige`, `indigo`, `sky`, `red`, `white`.

---

## 9. Learner API — exact mobile compatibility inventory

All paths below are relative to the configured `/v1` base. `Auth` means bearer access token required.

### 9.1 Authentication and profile

| Method/path | Auth | Request | Response |
|---|---:|---|---|
| `POST /auth/login` | No | `{phone,password}` or `{email,password}` | `{tokens: SessionTokens, profile: LearnerProfile}` |
| `POST /auth/register` | No | `{fullName,email?,phone,password}` | `{challengeId}` |
| `POST /auth/challenges/{id}/verify` | No | `{code}` | `{tokens, profile}` |
| `POST /auth/password/forgot` | No | `{phone}` or `{email}` | `{challengeId}` |
| `POST /auth/password/verify` | No | `{challengeId,code}` | `{resetToken}` |
| `POST /auth/password/reset` | No | `{resetToken,password}` | 204/empty |
| `POST /auth/google/exchange` | No | `{idToken}` | `{tokens, profile}` |
| `POST /auth/refresh` | Refresh | `{refreshToken}` | `{accessToken,refreshToken,accountId,expiresAt}` |
| `POST /auth/logout` | Yes | empty | 204/empty |
| `GET /me` | Yes | — | `LearnerProfile` |
| `PATCH /me` | Yes | supported profile patch | updated `LearnerProfile` |
| `POST /me/deletion-requests` | Yes | empty | `{requestId,status: requested|deleted,message?}` |

Registration validation currently expected by UI: full name at least 2 characters, optional valid email, Indian-style 10-digit phone beginning 6–9, password at least 8 characters, six-digit verification code. Backend policy may be stronger but errors must map to `fieldErrors`.

`LearnerProfile` includes ID, full name, email/phone/masked phone, avatar URL, currently learning label, city, interests, member-since date, course/test/streak stats, and achievements. “Currently learning” is display/profile metadata and must not grant access.

### 9.2 Home, catalogue, and search

| Method/path | Auth | Query/request | Response |
|---|---:|---|---|
| `GET /home` | Optional | — | `HomeDashboard` |
| `GET /categories` | Optional | `kind,search?,pricing?,cursor?` | `Page<CatalogItem>` |
| `GET /search` | Optional | `q,type?,cursor?` | `Page<CatalogItem & {badge}>` |
| `GET /courses/{id}` | Optional | — | `Course` |
| `GET /exams/{id}` | Optional | — | `Exam` |

`kind` values sent by app: `course`, `exam`, `news`, `topic`, `fact`, `interview`. `pricing`: `all`, `free`, `paid`. Guest responses must return honest access decisions and omit private learner data.

`HomeDashboard` contains optional greeting name, live classes, optional Continue Learning target (`courseId`, `lessonId`, optional enrollment ID, labels, percent), and unread notification count. Additive API-driven banners/Explore/app config should be versioned so older app builds remain compatible.

### 9.3 Learning, bookmarks, semesters, and projects

| Method/path | Auth | Request | Response |
|---|---:|---|---|
| `GET /me/enrollments` | Yes | — | `Enrollment[]` |
| `POST /courses/{id}/enroll` | Yes | empty | `Enrollment` |
| `GET /courses/{id}/lessons` | Optional | — | `Lesson[]` |
| `GET /lessons/{id}` | Mixed | — | `Lesson & {resources,playbackUrl?}` |
| `POST /lessons/{id}/progress` | Yes | `{positionSeconds}` | 204/empty |
| `POST /lessons/{id}/complete` | Yes | empty | 204/empty |
| `GET /me/bookmarks` | Yes | — | `Bookmark[]` |
| `PUT /me/bookmarks/{kind}/{id}` | Yes | `{saved}` | 204/empty |
| `GET /enrollments/{id}/semesters` | Yes | — | `Semester[]` |
| `GET /enrollments/{id}/semesters/{semesterId}` | Yes | — | `Semester & {lessons,tests,projects}` |
| `POST /enrollments/{id}/semesters/{semesterId}/submit-review` | Yes | empty | 202/204 |
| `GET /projects/{id}` | Yes | — | `Project` |
| `POST /projects/{id}/submissions` | Yes | `{text?,fileId?}` | updated `Project` |

The lesson response currently accepts `playbackUrl`; production SHOULD replace/augment this with an explicit short-lived playback-session object containing expiry and provider metadata. Progress writes should be monotonic/idempotent and reject positions beyond media duration. Complete must validate the configured rule.

### 9.4 Assessments

| Method/path | Auth | Request/query | Response |
|---|---:|---|---|
| `GET /tests` | Mixed | `examId?` | `TestDefinition[]` |
| `GET /tests/{id}` | Mixed | — | `TestDefinition` |
| `POST /tests/{id}/attempts` | Yes | empty | `Attempt` |
| `GET /attempts/{id}` | Yes | — | `Attempt & {questions}` |
| `PUT /attempts/{id}/answers/{questionId}` | Yes | `{optionId,revision}` | `{revision}` |
| `POST /attempts/{id}/submit` | Yes | `{revision}` | `TestResult` |
| `GET /attempts/{id}/result` | Yes | — | `TestResult` |
| `GET /me/attempts` | Yes | — | `TestResult[]` |
| `GET /practice/daily` | Yes | `kind=facts|interview` | `{testId}` |

Starting an attempt must enforce access, assignment, limit, and window, and should return an existing resumable attempt according to policy rather than silently duplicating it. The attempt owner is always derived from the token.

### 9.5 Editorial content

| Method/path | Auth | Query/request | Response |
|---|---:|---|---|
| `GET /news` | Optional | `categoryId?,cursor?` | `Page<NewsArticle>` |
| `GET /news/{id}` | Optional | — | `NewsArticle` |
| `GET /awareness/topics/{id}` | Optional | — | `AwarenessTopic` |
| `GET /facts` | Optional | `categoryId?,cursor?` | `Page<Fact>` |
| `GET /facts/{id}` | Optional | — | `Fact` |
| `PUT /facts/{id}/reaction` | Yes | `{reacted}` | updated `Fact` |
| `GET /interview/questions` | Optional | `categoryId?` | `InterviewQuestion[]` |
| `GET /interview/questions/{id}` | Optional | — | `InterviewQuestion` |

Premium list metadata may be visible while protected bodies remain access-controlled. Bookmarking editorial content uses the generic bookmark endpoint.

### 9.6 Live classes

| Method/path | Auth | Request/query | Response |
|---|---:|---|---|
| `GET /live-classes` | Optional | `from,to` ISO timestamps | `LiveClass[]` |
| `GET /live-classes/{id}` | Mixed | — | `LiveClass` |
| `POST /live-classes/{id}/join` | Yes | empty | `{playbackUrl?,chatAvailable,expiresAt?}` |
| `PUT /live-classes/{id}/hand` | Yes | `{raised}` | `{raised}` |
| `PUT /live-classes/{id}/reminder` | Yes | `{enabled}` | 204/empty |
| `POST /live-classes/{id}/chat` | Yes | `{body,clientId}` | `{id,body,at}` |
| `GET /live-classes/{id}/chat` | Yes | — | chat message array |

Join authorization must check class state, enrollment/batch/audience, entitlement, join window, capacity, and account state. `clientId` deduplicates chat retries. Chat availability must also be enabled by a released mobile capability.

### 9.7 Checkout, payments, and entitlements

| Method/path | Auth | Request/query | Response |
|---|---:|---|---|
| `POST /checkout/quote` | Yes | `{productId,coupon?}` | quote plus `{productId,title}` |
| `POST /orders` | Yes | `{productId,coupon?,method?}` + `Idempotency-Key` | `Order` |
| `GET /orders/{id}` | Yes | — | `Order` |
| `POST /payments/verify` | Yes | `{orderId,...providerPayload}` | `Order` |
| `POST /payments/restore` | Yes | `{provider:'play_billing',purchases}` | `Order[]` |
| `GET /me/orders` | Yes | — | `Order[]` |
| `GET /me/entitlements` | Yes | — | `{productId,access}[]` |

The backend must independently validate store product, purchase token/receipt, price/currency, package/bundle, account binding, acknowledgement/consumption rules, and replay. Raw provider payloads must be filtered before logging.

### 9.8 Notifications and push devices

| Method/path | Auth | Request/query | Response |
|---|---:|---|---|
| `GET /me/notifications` | Yes | `cursor?,category?` | `Page<NotificationItem>` |
| `PATCH /me/notifications/{id}` | Yes | `{read:true}` | 204/empty |
| `POST /me/notifications/clear` | Yes | empty | `{mode:'archive'|'mark_read'}` |
| `PUT /me/push-devices/current` | Yes | `PushDeviceRegistration` | 204/empty |
| `POST /me/push-devices/unregister` | Yes | `{installationId}` | 204/empty |

`PushDeviceRegistration` currently uses provider `fcm`, platform `android`, installation ID, app version, locale, timezone, and enabled non-system categories. Upsert by provider/installation, transfer to the current learner, update `lastSeenAt`, encrypt identifiers, and remove permanently invalid FCM registrations.

### 9.9 Documents, downloads, support, and legal

| Method/path | Auth | Request/query | Response |
|---|---:|---|---|
| `GET /me/documents` | Yes | `kind?=admit_card|certificate` | `IssuedDocument[]` |
| `GET /me/documents/{id}` | Yes | — | `IssuedDocument` |
| `POST /resources/{id}/download-authorization` | Yes | empty | `{url,expiresAt,offlineUntil?,sha256?}` |
| `GET /me/downloads` | Yes | — | `DownloadItem[]` |
| `GET /support` | No | — | `{faqs:[{q,a}],email?,phone?}` |
| `GET /legal/{slug}` | No | — | `{title,body}` |

Download authorization URLs must be HTTPS, short-lived, and scoped. If `sha256` is present it must be a 64-character hexadecimal digest. `offlineUntil` must reflect entitlement/license policy and cannot exceed revocation requirements without an offline DRM design.

---

## 10. Admin API inventory

Use `/v1/admin`. The following is the minimum resource/command surface; generate the exact OpenAPI contract before implementation.

### 10.1 Session and administration

```text
POST   /admin/auth/login
POST   /admin/auth/mfa/verify
POST   /admin/auth/logout
GET    /admin/me
GET    /admin/sessions
DELETE /admin/sessions/{id}
GET/POST/PATCH /admin/admins
GET/POST/PATCH /admin/roles
GET    /admin/permissions
```

### 10.2 Learners and learning

```text
GET    /admin/learners
GET    /admin/learners/{id}
PATCH  /admin/learners/{id}
POST   /admin/learners/{id}/suspend|reactivate|revoke-sessions
GET    /admin/learners/{id}/timeline
GET/POST/PATCH /admin/batches
POST   /admin/batches/{id}/members:preview
POST   /admin/batches/{id}/members:import
GET/POST /admin/enrollments
POST   /admin/enrollments/{id}/revoke
GET/POST /admin/entitlements
POST   /admin/entitlements/{id}/revoke
```

### 10.3 Content and curriculum

Provide list/detail/version/preview/submit-review/approve/publish/unpublish/archive/reorder operations as appropriate for:

```text
/admin/explore-sections  /admin/banners       /admin/app-config
/admin/courses           /admin/semesters     /admin/lessons
/admin/resources         /admin/media         /admin/news
/admin/awareness         /admin/facts         /admin/interview
/admin/legal
```

Publish and archive are commands, not arbitrary status patches.

### 10.4 Academic operations

```text
GET/POST/PATCH /admin/questions
GET/POST/PATCH /admin/tests
POST   /admin/tests/{id}/validate|submit-review|approve|publish|unpublish
GET    /admin/attempts
GET    /admin/attempts/{id}
POST   /admin/attempts/{id}/expire|invalidate
GET    /admin/results
POST   /admin/results/{id}/recompute|override|publish
POST   /admin/rank-runs
GET    /admin/project-submissions
POST   /admin/project-submissions/{id}/approve|request-changes
GET    /admin/semester-reviews
POST   /admin/semester-reviews/{id}/approve|request-changes
```

### 10.5 Live operations

```text
GET/POST/PATCH /admin/live-classes
POST   /admin/live-classes/{id}/start|end|cancel
POST   /admin/live-classes/{id}/recording/publish|unpublish
GET    /admin/live-classes/{id}/participants|attendance|chat
POST   /admin/live-classes/{id}/participants/{learnerId}/remove
POST   /admin/live-classes/{id}/chat/{messageId}/hide
```

### 10.6 Communications

```text
GET/POST/PATCH /admin/notification-campaigns
GET    /admin/notification-campaigns/{id}/preview
POST   /admin/notification-campaigns/{id}/submit-approval|approve|publish|cancel
GET    /admin/notification-campaigns/{id}/metrics|deliveries
GET/POST/PATCH /admin/notification-templates
```

### 10.7 Commerce and documents

```text
GET/POST/PATCH /admin/products|prices|coupons
GET    /admin/orders|payments|refunds|reconciliation
POST   /admin/orders/{id}/recheck
POST   /admin/refunds/{id}/approve|reject
GET/POST/PATCH /admin/document-templates
POST   /admin/documents/eligibility:preview
POST   /admin/documents/generation-jobs
POST   /admin/documents/{id}/issue|revoke|supersede
GET    /admin/document-verification-events
```

### 10.8 Support, privacy, reports, and platform

```text
GET/POST/PATCH /admin/support-cases
POST   /admin/support-cases/{id}/assign|reply|resolve|reopen
GET    /admin/privacy-requests
POST   /admin/privacy-requests/{id}/verify|approve|complete|reject
GET/POST /admin/reports|exports
GET    /admin/exports/{id}
GET    /admin/audit-events
GET    /admin/jobs|webhook-events
POST   /admin/webhook-events/{id}/replay
GET/PATCH /admin/feature-flags
```

### 10.9 Admin command rules

Each command accepts `reason` when operationally significant, optional `revision`/`If-Match`, and an `Idempotency-Key`. Response includes the updated resource or a job `{id,status}`. Bulk commands first provide a preview with counts/warnings, then execute against an immutable selection snapshot.

---

## 11. Webhooks, background jobs, and realtime

### 11.1 Webhooks

- Verify signature and timestamp, reject replay, and store provider event ID under a unique constraint.
- Acknowledge quickly; process asynchronously and idempotently.
- Retain a redacted raw payload according to policy.
- Domains: payment/refund/dispute, store subscription if later enabled, live room/recording, email/SMS/OTP delivery, push outcomes where available, storage/media processing.
- Admin can search status/attempts and safely replay only after authorization.

### 11.2 Job requirements

Jobs expose type, state, progress, created/started/finished timestamps, actor/correlation ID, retry count, error class, and result artifact. Required jobs include notification fan-out, exports, imports, media processing, document generation, rank runs, reconciliation, scheduled publication, and retention/deletion.

### 11.3 Realtime

Authenticate every subscription and authorize its course/batch/room scope. Reconnect from a cursor/last event. Realtime messages are hints; clients refetch critical state. Do not place durable grades, payment truth, or entitlement grants only in a socket event.

---

## 12. Validation and business rules

1. IDs are immutable; slugs/titles may change.
2. A paid catalogue item must reference an active product and a defined access decision.
3. Guests may receive public metadata/previews but never learner-specific records.
4. Enrollment does not bypass product entitlement unless the course is free or an audited admin grant exists.
5. Progress is bounded by curriculum/media and cannot unlock prerequisites outside configured rules.
6. Attempt questions and marking rules are snapshotted at start.
7. Stale answer/result/approval revisions return 409, not last-write-wins.
8. Semester approval and next unlock happen atomically.
9. Provider callbacks alone do not identify a learner; bind verified provider transaction to the server order/account.
10. Notification targets must exist, be published/accessible at send time, and be validated again when opened.
11. Document QR verification shows current issued/revoked/superseded/expired truth.
12. Archive referenced records; never cascade-delete learning/payment/audit history.
13. All list/search filters are allowlisted and tenant/scope constrained.
14. Admin exports apply the same row-level permissions as on-screen data.

---

## 13. Security and privacy requirements

- Follow OWASP ASVS/API guidance: parameterized queries, schema validation, output encoding, CSRF protection for cookie sessions, strict CORS, CSP, secure headers, dependency scanning, and secret scanning.
- Enforce object-level authorization on every learner/admin resource ID.
- Hash passwords with an approved memory-hard algorithm and breached-password checks where possible.
- Encrypt databases/storage/backups and sensitive provider/device identifiers.
- Keep secrets in a managed secret store; never in mobile builds, admin JavaScript, logs, or the repository.
- Redact authorization headers, passwords, OTPs, refresh tokens, purchase tokens, FIDs, signed URLs, and private documents from logs.
- Rate-limit by account, IP, device, and operation risk. Protect search/export and OTP endpoints from enumeration/scraping.
- Audit staff reads of highly sensitive learner/financial records where appropriate.
- Provide retention schedules for sessions, challenges, provider payloads, notifications, exports, support attachments, and audit data.
- Export artifacts use short-lived signed download links and expire automatically.
- Backups are encrypted, monitored, restore-tested, and covered by documented RPO/RTO.
- Perform threat modeling and independent security review before production.

---

## 14. Non-functional and operational requirements

### 14.1 Performance targets

- Define SLOs before launch. Suggested starting targets: p95 learner read API under 500 ms excluding media/provider latency; p95 admin list under 1 s for normal filtered data; command acknowledgement under 1 s when work is queued.
- Cursor-paginate unbounded lists. Index common search/filter/order columns.
- Never synchronously fan out bulk notifications, generate bulk PDFs, or create large exports in an HTTP request.

### 14.2 Reliability

- Idempotent workers and provider-event ingestion.
- Transactional outbox for cross-boundary work.
- Retry transient provider failures with bounded exponential backoff and dead-letter visibility.
- Health/readiness checks include required dependencies without exposing secrets.
- Graceful degradation: editorial reads may continue during a notification outage; no false payment success during provider outage.

### 14.3 Observability

Structured logs with request/correlation IDs; metrics for latency/error/saturation; distributed traces across API/jobs/providers; dashboards and actionable alerts. Track refresh failures, login abuse, attempt conflicts, payment verification lag, entitlement lag, live join failures, push invalid tokens, job backlog, document failures, and webhook dead letters.

### 14.4 Accessibility and admin UX

Meet WCAG 2.2 AA for admin web: keyboard navigation, visible focus, semantic labels, sufficient contrast, zoom/reflow, accessible validation and dialogs. Support latest stable Chrome/Edge/Firefox/Safari and usable tablet widths. Mobile-phone admin may be read-only for dangerous workflows.

---

## 15. Reporting and analytics

Minimum reports:

- learner growth, verification, activity, retention, and account states;
- enrollments, starts, completion, lesson drop-off, semester review SLA;
- assessment participation, completion, scores, pass rates, question difficulty/discrimination, integrity flags;
- live attendance, join failures, peak concurrency, reconnects, recording use;
- orders, payment success/failure, verification delay, refunds/disputes, entitlement lag;
- notification delivery/open/read/opt-out by campaign/category;
- document eligibility/generation/issue/revocation/verification;
- support volume, category, SLA, resolution;
- admin activity, overrides, approvals, bulk actions, exports.

Reports specify timezone, date range, filters, definitions, freshness, and whether values are exact or sampled. Exports are asynchronous, permission-filtered, watermarked where needed, audited, and expire.

Event taxonomy should include app/session, catalogue/detail/search, lesson start/progress/complete, checkout/order/payment, attempt lifecycle, project/semester review, live join/leave/reconnect, notification open/read, download authorization, document open/verify, and support actions. Do not put sensitive free text or tokens in analytics.

---

## 16. Testing and acceptance

### 16.1 Automated coverage

- Unit tests for permission evaluation, state transitions, pricing, scoring, eligibility, audience resolution, and DTO mapping.
- Contract tests generated from OpenAPI for every learner endpoint above.
- Integration tests with database/queue/storage and sandbox provider adapters.
- Admin component tests for tables/forms/permission states.
- End-to-end tests for critical learner and staff journeys.
- Load tests for login, catalogue, attempt saves/submits, live joins, notification fan-out, and exports.
- Security tests for object authorization, CSRF, injection, upload abuse, replay, ID enumeration, and privilege escalation.

### 16.2 Required end-to-end journeys

1. Register -> verify -> refresh -> profile -> logout/revoke.
2. Guest browse -> protected destination -> login -> return to destination.
3. Publish course -> enroll/access -> lesson progress -> complete -> resume.
4. Paid product -> quote -> idempotent order -> provider verify -> entitlement -> restore.
5. Test publish -> start -> answer revisions -> resume -> atomic submit -> result/solution release.
6. Project submit -> request changes -> resubmit -> semester approve -> next unlock.
7. Live schedule -> reminder -> authorized join -> attendance -> end -> recording.
8. Compose single/bulk notification -> approval -> inbox/push -> deep link -> read state.
9. Eligibility -> generate -> issue certificate/admit card -> public verify -> revoke/supersede.
10. Protected PDF authorization -> checksum -> offline expiry/revocation behavior.
11. Learner suspension/deletion request -> session revocation -> retention workflow.
12. Admin role scope, second approval, export expiry, and immutable audit evidence.

### 16.3 Release gates

- OpenAPI and migration history reviewed and versioned.
- No live endpoint returns mock data.
- All mobile contract endpoints pass staging contract tests.
- RBAC/row scope and audit coverage tested.
- Payment and entitlement reconciliation tested using provider sandbox.
- Push and deep links tested foreground/background/killed app.
- Backup restore and rollback rehearsed.
- Legal/support contacts and production policy content approved.
- Secrets, provider configs, alerting, runbooks, data retention, and on-call ownership completed.

---

## 17. Delivery sequence

### Phase 0 — decisions and foundations

Approve open decisions, API conventions, identity model, RBAC, environments, CI/CD, migrations, audit, storage, jobs, OpenAPI, and observability.

### Phase 1 — core learner platform

Authentication/profile, support/legal, catalogue/search/home, course/lesson/enrollment/progress/bookmarks, core admin learners/content/curriculum.

### Phase 2 — assessments and semester learning

Question bank, tests, attempts/results, projects/submissions, semester review/unlock, academic admin queues.

### Phase 3 — commerce and protected media

Products/quotes/orders/provider verification, entitlements, reconciliation, PDF authorization, media/session security.

### Phase 4 — communications and live

Inbox, device registration, campaign workflows, FCM workers, live provider, attendance/moderation/recording.

### Phase 5 — documents, reporting, and hardening

Templates/eligibility/issue/verify/revoke, reports/exports, load/security/accessibility testing, DR rehearsal, production launch.

Each vertical slice includes migration, domain logic, learner/admin API, admin UI, audit, permissions, tests, monitoring, runbook, and rollback—not only a screen.

---

## 18. Decisions required before production integration

The product/backend owner must answer these explicitly:

1. Dev/staging/prod base URLs, API versioning/deprecation window, and ownership contacts.
2. Canonical login identifiers, OTP provider/TTL/attempt limit, password policy, refresh rotation/lifetime, verified contact rules, Google account-linking rules.
3. Branch/tenant model and staff scope hierarchy.
4. Catalogue taxonomy and whether free Tally and certification Tally remain separate products.
5. Course completion and lesson progress rules; position write frequency and rounding.
6. Semester prerequisite, review SLA, auto/manual submission, rejection/resubmission, and certificate eligibility.
7. Test marking, negative marks, limits, resume/expiry, randomization, integrity, ranking, correction, and solution release.
8. Video/live provider, token TTL, DRM/offline license, chat/moderation/recording/retention.
9. Android/iOS commerce policy: Play Billing/App Store versus permitted external route, product IDs, taxes, refunds, disputes, acknowledgement, delayed entitlement SLA.
10. Notification provider(s), sender approval thresholds, retention, quiet hours, preference policy, and deep-link host rules.
11. Upload/download limits, accepted types, scan provider, checksums, storage retention, offline license window.
12. Document legal fields, template/signatory owners, QR payload, public verification disclosure, revocation policy.
13. Production languages/localization workflow and fallback behavior.
14. Support channels/SLA, real privacy/terms/refund copy, consent requirements, deletion/retention rules.
15. Admin frontend/backend technology, hosting region, database, queue, storage, monitoring, RPO/RTO, and launch SLOs.
16. Whether course reviews, exam videos, voice search, recurring subscription, leaderboard, and backend feedback cases are in launch scope.

No team should silently invent answers to these items and present them as production policy.

---

## 19. Implementation source map

This handover was reconciled against the following current sources:

| Source | Purpose |
|---|---|
| `src/core/types.ts` | Canonical mobile domain DTOs and state enums |
| `src/core/repositories.ts` | Mobile repository interfaces |
| `src/core/api/httpRepositories.ts` | Exact currently wired HTTP methods and paths |
| `src/core/api/http.ts` | Headers, timeout, error mapping, token refresh behavior |
| `src/core/config.ts` | Data mode, capabilities, provider switches |
| `src/navigation/types.ts` | Route and parameter inventory |
| `src/core/offlineFiles.ts` | Protected download checks and limitations |
| `src/features/settings/preferences.ts` | Local language, goal, notification, media, reminder settings |
| `src/mocks/` | Development fixtures and state scenarios; not production truth |
| `docs/WEB_ADMIN_PANEL_REQUIREMENTS.md` | Extended admin product requirements |
| `docs/notification-system.md` | Notification/FCM details |
| `docs/flows/` | Learner journey descriptions |

If this document and executable mobile contracts differ, reconcile deliberately, update OpenAPI and the mobile adapter together, and record the compatibility decision. Do not change response shapes ad hoc.

---

## 20. Handover deliverables checklist

Backend/admin team must return:

- [ ] Approved version of the decisions in Section 18.
- [ ] OpenAPI 3.1 specification and generated examples for every learner/admin endpoint.
- [ ] Environment base URLs and non-production sandbox learner/admin accounts.
- [ ] Database ERD, migration strategy, data dictionary, retention classification, and seed/reference data.
- [ ] RBAC matrix including scope and separation-of-duty rules.
- [ ] Provider integration documents and sandbox setup for identity, OTP, billing, push, live, storage/media.
- [ ] Admin wireframes/design system and acceptance mapping for every module.
- [ ] Error-code catalogue, webhook schemas, event taxonomy, and deep-link target registry.
- [ ] Security model, threat model, secrets policy, privacy/retention policy, and incident contacts.
- [ ] CI/CD, rollback, backup/restore, monitoring/alerting, runbooks, SLOs, RPO/RTO.
- [ ] Contract/integration/E2E/load/security test evidence.
- [ ] Staging sign-off demonstrating all critical journeys in Section 16.2.

Completion means the learner app can run in API mode without mock fallback, staff can operate routine work entirely through the authorized admin portal, authoritative states remain consistent under retries/failures, and every privileged action is traceable.
