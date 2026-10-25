# Missing and incomplete screens

Review of the REDI learner app (`com.rediapp.learner`) against the current navigation, screen files, and clay UI. This list is what is missing or under-designed. Recurring subscription is out of product scope and is not covered here.

The app already has the main learner loops: splash and auth, five tabs (Home, Live, Courses, My Learning, Profile), discovery hubs, course and lesson playback, exams and tests, news, awareness, facts, interview practice, checkout and one-time payments, semesters, downloads, documents, settings, help, and legal.

About **58** `*Screen.tsx` files exist under `src/screens`. Almost every registered route has a real screen. The gaps below are the exceptions.

---

## 1. Screens that do not exist

These are routes or product surfaces that a learner would expect and that the codebase does not implement.

### 1.1 Filters

| | |
| --- | --- |
| Status | Typed, never built |
| Type | `Filters: {scope: string}` in `src/navigation/types.ts` (`RootStackParamList`) |
| Navigator | Not registered in `RootNavigator` |
| Screen file | None |
| Navigation calls | None |

Search, news, exams, and awareness already filter with chips inside the screen. The dedicated `Filters` route was planned as a placeholder (`docs/screen-inventory.md`) and was never turned into a screen.

**What is weak today**

- `DownloadsScreen` shows a filter button in the header, then ignores it: `onFilter={() => undefined}` in `src/screens/downloads/DownloadsScreen.tsx`.
- Catalog and search filters are local chip rows. There is no shared filter sheet for price (free / paid), level, subject, language, or duration.
- The type promises a `scope` argument (`courses`, `exams`, `search`, `downloads`) that nothing consumes.

**What a real Filters surface should do**

- A modal or bottom sheet, not a full tab. Same clay cards, chips, and primary button as Search.
- Scope-specific fields:
  - Courses: free / paid, subject, level, duration.
  - Exams: exam family (SSC, Banking, Railway, UPSC), free / paid, test availability.
  - Search: content type (course, exam, news, fact, interview).
  - Downloads: kind (videos, notes, PDFs) and status (queued, downloading, done). Downloads already has chips; the header button should open those, or the button should be removed.
- Apply and clear should return the chosen filters to the caller. Do not leave a dead route in `RootStackParamList` if the sheet stays inline.

**Files to touch**

- `src/navigation/types.ts` — keep or delete `Filters`.
- `src/navigation/RootNavigator.tsx` — register only if it becomes a real route.
- `src/screens/search/SearchScreen.tsx`, catalog hubs, `src/screens/downloads/DownloadsScreen.tsx`.
- New: `src/screens/search/FiltersSheet.tsx` (or similar), reusing `FilterChip` from `src/components/ui`.

### 1.2 Onboarding / first run

| | |
| --- | --- |
| Status | Intentionally absent |
| Evidence | `docs/design-decisions.md` does not define a first-run flow. Splash goes straight to auth or Main. |

There is no goal picker, exam-track picker, or language intro before Home. Guests land in the tab app immediately.

**Why it still matters**

Home is a wide institute catalog (computer courses, competitive exams, news, awareness, facts, interview, live). A short first run would tell the app which track to put first.

**Suggested screens (2–3, not a tour of every feature)**

1. **What are you preparing for?** — Computer course, competitive exam, or general learning. Stores a preference, does not create a fake account.
2. **Language** — Reuse the language choices already in Settings.
3. **Continue** — Guest browse or Login / Register. Skip must be obvious.

Do not add a marketing carousel. The clay system and `Screen` layout are enough.

**Entry**

- After splash, only when no onboarding flag is stored.
- Settings should be able to change the same preference later.

### 1.3 Change password (signed-in)

| | |
| --- | --- |
| Status | Missing from Settings |
| Existing auth | `ForgotPassword` → `VerifyContact` → `ResetPassword` from the logged-out stack only |

A signed-in learner cannot change their password from Profile or Settings. They have to log out and use forgot-password.

**Suggested screen**

- Route: `ChangePassword` on the Profile stack.
- Fields: current password, new password, confirm.
- Entry: Settings, near Edit Profile.
- Success returns to Settings. Failure stays on the form with the existing error text style.

This is separate from `ResetPasswordScreen`, which is for the OTP recovery flow.

### 1.4 About the institute

| | |
| --- | --- |
| Status | Missing |
| Nearby screens | `HelpSupportScreen`, `LegalScreen` |

Profile and Settings cover account, help, and legal. There is no About REDI screen: institute name, what the app is for, app version in a learner-facing place (Settings has a small version line aimed at developers), campus or support address, or links to privacy and terms.

**Suggested screen**

- Route: `About` on the Profile stack.
- Entry: Settings or the Profile account list, next to Help & Support.
- Content: short institute description, app version, links to `Legal` (`privacy`, `terms`) and Help & Support.
- Do not invent campus claims, refund promises, or URLs that are not already in config or the backend. `docs/design-decisions.md` already says sample SSL, 7-day refund, and `redi.app/verify` are not shipped promises.

### 1.5 Feedback

| | |
| --- | --- |
| Status | Missing as a screen |
| Nearby | Help & Support renders FAQ cards and an email button from `repos.account.support()` |

There is no in-app “send feedback” form and no store-rating prompt. FAQ plus mailto is the whole support path.

**Suggested screen**

- Route: `Feedback` on the Profile stack.
- Entry: Help & Support, a secondary button under the FAQ list.
- Fields: category (bug, content, payment, other), message, optional screenshot later.
- Submit should call a real support endpoint when one exists. Until then, keep the existing email action and do not pretend a ticket was created.

### 1.6 Leaderboard / rank

| | |
| --- | --- |
| Status | Missing |
| Nearby | Daily Quiz, Test Runner, Test Result, Result History. Profile shows a day streak stat only. |

Exam prep is a core tab path, but results stay private. There is no rank, percentile, or “this week’s quiz” board.

**Suggested screen**

- Route: `Leaderboard` from Result History or the quiz result.
- Scope it to one exam or the daily quiz. A global board across every course will be noisy.
- Empty state when the learner has no attempts yet, with a link into Daily Quiz or Test List.
- Only add this if the backend can return ranks. Do not fake positions in the mock and ship them as product.

### 1.7 Dedicated Saved library (optional)

Saved items are **not** missing. `MyLearningScreen` already loads bookmarks, filters them, and supports remove. News articles and interview questions can be saved.

What is missing is a **standalone** Saved screen reachable from Profile (next to Downloads and Certificates). Today “See all” on My Learning only clears the local filter (`setFilter('All')`). It does not open another route.

Treat this as optional. If My Learning remains the saved home, change the “See all” label so it does not imply a second screen.

---

## 2. Screens that exist but are not designed

These routes render, but the UI is a placeholder, a coming-soon card, or a capability that is turned off.

### 2.1 Course reviews — inside Course Detail

| | |
| --- | --- |
| File | `src/screens/courses/CourseDetailScreen.tsx` (`ReviewsTab`) |
| What shows | A rating card (score and learner count), then an empty state |

Copy today:

- Title: “Written reviews are coming soon”
- Body: “Verified learner feedback will appear here as it becomes available.”

The Reviews tab is a designed shell with no review list, no write-review action, and no loading or error state for a reviews query.

**Design this tab as**

- Summary card (keep the rating).
- List of verified reviews: name, stars, date, text.
- Empty state only when the course has zero reviews, not as the permanent UI.
- “Write a review” only for learners who are enrolled or have purchased. Guests get a sign-in prompt, same pattern as My Learning.

### 2.2 Exam video lessons — inside Exam Detail

| | |
| --- | --- |
| File | `src/screens/exams/ExamDetailScreen.tsx` |
| Tab | `videos` |

The Videos tab is a single sky card:

- Title: “Video lessons are coming soon”
- Body points the learner back to the syllabus and mock tests.

Syllabus and tests on the same screen are real. Videos are not.

**Design this tab as**

- Same lesson-row pattern as Course Detail: title, duration, lock or free badge, tap to `LessonPlayer`.
- Empty state only when that exam has no published videos.
- If videos are paid, use the existing access badge and Checkout path. Do not add a second paywall style.

### 2.3 Topic guide — inside Topic Detail

| | |
| --- | --- |
| File | `src/screens/awareness/TopicDetailScreen.tsx` |

When access is granted but `entries.length === 0`, the screen shows:

- Title: “Guide coming soon”
- Body: “We’re preparing the key facts and practice cards for this topic.”

Locked topics already have a separate empty state (“This guide is locked”). The coming-soon state is for published topics that have no cards.

**Design this state as**

- A real empty state is fine when content is unpublished.
- Do not leave “coming soon” on topics that are listed on General Awareness. Either publish entries or hide the topic from the hub.
- When entries exist, Learn / quiz modes are already built. Those should be the normal path.

### 2.4 Voice search — inside Search

| | |
| --- | --- |
| File | `src/screens/search/SearchScreen.tsx` |
| Config | `appConfig.capabilities.speechSearch` is `false` in `src/core/config.ts` |
| Service | `src/core/services.ts` marks speech `available` from that flag |

The microphone control is on the search field. With the flag off, the UI tells the learner voice search is unavailable. `docs/design-decisions.md` says the caption stays unavailable unless `REDI_SPEECH_ENABLED=true` and a native speech-to-text adapter exists.

**Design choice**

- Ship voice: native adapter, permission prompt, listening state, and text dropped into the existing query.
- Or remove the mic until that adapter exists. An always-disabled control reads as an unfinished screen.

### 2.5 Push notifications — Notification Settings

| | |
| --- | --- |
| File | `src/screens/settings/NotificationSettingsScreen.tsx` |
| Config | `pushProvider: 'none'` in `src/core/config.ts` |

The screen explains that notifications are in-app only. The inbox (`NotificationsScreen`) is a real screen. System push (class reminders, test results, payment status) is not.

**Design this screen as**

- Keep in-app toggles that the app actually honors.
- When `pushProvider` is `'none'`, do not show toggles that look like they will send phone alerts.
- When FCM or APNs is wired, add permission status, a system-settings link, and per-type toggles (live class, results, payments).

### 2.6 Downloads

| | |
| --- | --- |
| File | `src/screens/downloads/DownloadsScreen.tsx` |
| Unused sibling | `src/screens/downloads/DownloadList.tsx` (has `EmptyState`; the screen does not use it) |

What the screen does today:

- Usage card from the local manifest (honest byte count, not a fake quota).
- Chips: All, Videos, Notes, PDFs.
- A row per file: title, status, size, progress while downloading.
- A note about Wi-Fi-only.
- Header filter button that does nothing.
- No `LoadingBlock`, `ErrorState`, or `EmptyState`. An empty chip filter renders a blank list under the usage card.

**Design this screen as**

- Loading, error with retry, and empty (“No downloads yet” / “No PDFs downloaded”).
- Remove the dead filter button or wire it to the chips.
- Row actions the manifest can support: open, retry failed, delete. Do not promise background download behavior the OS does not guarantee (the yellow note already says this).

### 2.7 Legal

| | |
| --- | --- |
| File | `src/screens/support/LegalScreen.tsx` |
| Routes | `Legal` (signed in), `PublicLegal` (logged out) |

The screen is structurally fine: header, loading, error, body text. The body is placeholder policy copy from mocks until the backend supplies real privacy and terms text.

**Design gap**

- Replace mock paragraphs with the institute’s real policy.
- Keep the loader and error state.
- Do not treat the current mock wording as the published policy.

---

## 3. Screens that are wired but thin

These load data and navigate, but they skip the feedback patterns used everywhere else (`LoadingBlock`, `EmptyState`, `ErrorState` from `src/components/ui`).

### 3.1 Interview Question List

| | |
| --- | --- |
| File | `src/screens/interview/InterviewQuestionListScreen.tsx` |
| Route | `InterviewQuestionList` |
| Entry | Interview Prep category |

The screen is a back header titled “Questions” and a `ScrollView` of white cards (`item.prompt` only). It navigates to `InterviewQuestion`.

Missing:

- Loading and error (the query can fail silently; the list stays empty).
- Empty state when a category has no questions.
- Category name in the header (it always says “Questions”).
- Secondary line on each card (topic, difficulty), matching Interview Prep cards.

`InterviewPrepScreen` and `InterviewQuestionScreen` are much more complete. This list is the weak step between them.

### 3.2 Test List

| | |
| --- | --- |
| File | `src/screens/assessments/TestListScreen.tsx` |
| Route | `TestList` |
| Entry | Exam flow, “all tests” |

Same shape as the interview list: header “All Tests”, cards with title and `AccessBadge`, tap opens `TestInstructions`.

Missing:

- Loading, error, empty (“No tests for this exam”).
- Meta learners expect on an exam app: question count, duration, free or paid (badge exists; duration and count do not).
- Pull to refresh.

`ExamDetailScreen` already renders a richer test card on the exam’s Tests tab. `TestListScreen` should match that card, not a one-line row.

### 3.3 Order Detail

| | |
| --- | --- |
| File | `src/screens/payments/OrderDetailScreen.tsx` |
| Route | `OrderDetail` |
| Entry | Payment History |

The screen shows title, status, and “Recheck payment” when status is `unknownNeedsRecheck` or `verifying`.

Missing:

- Loading and error. While the query runs, the card shows empty title and status.
- Not-found state when `orderId` does not resolve.
- Amount, date, product, payment method, and order id.
- Next step by status: open the course, retry from Payment Failure, or wait on Payment Pending. Those screens already exist; this detail screen does not link to them.

`PaymentHistoryScreen`, `PaymentSuccessScreen`, `PaymentFailureScreen`, and `PaymentPendingScreen` are the designed payment set. Order Detail should look like a receipt, not a debug card.

---

## 4. Design consistency (not new routes)

These are not missing screens. They make finished screens feel unfinished.

### Guest walls

Guests can open the tabs. My Learning, enrolled courses, notifications, checkout, daily quiz, and test runner push them to sign in. That split is correct. Some blocks read as hard stops. Each gate should use the same guest card already on My Learning: icon, one sentence, “Login to continue”.

### Dark mode

Settings stores a theme preference and `ThemeProvider` applies it to chrome (background, headers, tab bar, status bar, Settings cards). There is no dark reference in the HTML board (`docs/design-decisions.md`). Clay cards on many screens still use hard-coded light fills. A dark pass should follow the token file (`darkColors` in `src/theme/index.ts`) screen by screen, starting with Home, Course Detail, and the five tab roots.

### Docs vs code

`docs/screen-inventory.md` still says Competitive Exams, Daily News, General Awareness, and Amazing Facts render `CatalogScreen`. The app uses dedicated screens:

- `src/screens/exams/CompetitiveExamsScreen.tsx`
- `src/screens/news/DailyNewsScreen.tsx`
- `src/screens/awareness/GeneralAwarenessScreen.tsx`
- `src/screens/facts/AmazingFactsScreen.tsx`

Those hubs are designed. The inventory doc is stale. `docs/process/navigation.md` also omits `PaymentFailure`, which is registered.

### Recovery

Session recovery is an inline view in the root flow, not a route. That is fine. It should keep using the same clay empty/error layout as other failures so it does not look like a raw debug panel.

---

## 5. What is already in good shape

Do not rebuild these while closing the gaps above.

| Area | Screens |
| --- | --- |
| Auth | Login, Register, Verify Contact, Forgot Password, Reset Password |
| Home and discovery | Home, Explore Sections, Computer Courses (`CatalogScreen`), Competitive Exams, Daily News, General Awareness, Amazing Facts, Interview Prep |
| Learning | Course Detail (except reviews), Lesson Player, Semester Outline, Semester Content, Semester Wait, Project Detail |
| Assessment | Daily Quiz, Test Instructions, Test Runner, Test Result, Result History |
| Content readers | News Feed, News Article, Topic Detail (when entries exist), Facts List, Fact Detail, Interview Question |
| Live | Live Schedule, Live Room |
| Payments (one-time) | Checkout, Payment Success, Payment Failure, Payment Pending, Payment History |
| Account | Profile, Edit Profile, Delete Account, Settings, Help & Support, Admit Card, Certificate, Document List |
| System | Splash, Notifications inbox, Enrolled Courses |

---

## 6. Suggested build order

| Order | Item | Kind | Why first |
| --- | --- | --- | --- |
| 1 | Test List, Interview Question List, Order Detail | Thin screens | Small files, same pattern, on paths learners already use |
| 2 | Downloads empty/loading/error and the dead filter button | Incomplete | Visible broken control |
| 3 | Course reviews and exam videos | Coming-soon holes | They sit on the course and exam screens people open before paying |
| 4 | Filters sheet, or delete the unused `Filters` type and the Downloads filter button | Missing route | Stops the typed-but-dead route from drifting |
| 5 | Change password | Missing | Expected next to Edit Profile |
| 6 | About and Feedback | Missing | Profile depth, no new commerce |
| 7 | Topic guide | Content rule | Hide empty topics or fill them; do not leave “coming soon” in the catalog |
| 8 | Voice search and push settings | Capability UI | Either wire the adapter or remove the disabled control |
| 9 | Onboarding | New flow | Only after Home personalization is a real preference |
| 10 | Leaderboard | New flow | Only with a real rank API |

Saved library stays optional and should not jump this list. My Learning already covers it.
