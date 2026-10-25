# Development data (dummy / mock)

REDI ships a **removable** development dataset so every screen and flow can be exercised without a live backend. Production/release builds always use `api` mode. The dataset includes bundled demo imagery and a compact local video so the main media flows also work without internet access.

## Modes

| Mode   | When                                              | Implementation                       |
| ------ | ------------------------------------------------- | ------------------------------------ |
| `mock` | Debug builds when `REDI_DATA_SOURCE` is not `api` | `src/mocks/` fixtures + repositories |
| `api`  | Release, or debug with `REDI_DATA_SOURCE=api`     | `src/core/api/httpRepositories.ts`   |

Configured in `src/core/config.ts` (`DataSource` / `isMockData`). Screens never branch on sample arrays — they call repositories through `useRepositories()`.

**Never fall back from an API error to dummy data.**

## What is covered

- Accounts: Deepak (active), Asha (new/empty), guest browse
- Courses, exams, curriculum, assessments, news, awareness, facts, interview, live classes
- **Payments:** seeded history (succeeded, paidAccessPending, cancelled, failed, unknownNeedsRecheck, awaitingProvider); demo checkout with selectable outcomes; coupon `REDI50`; **no real charges**
- Documents: admit cards / certificates marked **DEMO — NOT VALID** (issued, not issued, revoked)
- Downloads: completed, downloading, paused, failed, expired, queued
- Media: fictional learner avatar, course artwork, news artwork, and a local lesson/live-class MP4

## Demo credentials

| Account                 | Phone        | Password        | OTP      |
| ----------------------- | ------------ | --------------- | -------- |
| Active learner (Deepak) | `9876543210` | local `.env` only | `123456` |
| New learner (Asha)      | `9123456780` | local `.env` only | `123456` |

Also available from Login → “Login with Dummy Account” and Settings → Development data.

## Payment scenarios

Checkout / Settings → **Demo payment outcome**:

- success — pay + grant access
- delayed — pay + `paidAccessPending`
- cancel / fail / unknown — matching order screens

Product id containing `delayed` also forces delayed access after verify.

## Ownership layout

| Path                        | Role                                           |
| --------------------------- | ---------------------------------------------- |
| `src/mocks/data/`           | Accounts, payments, documents, downloads, meta |
| `src/mocks/fixtures.ts`     | Remaining catalogue fixtures + re-exports      |
| `src/mocks/repositories.ts` | In-memory repositories                         |
| `src/mocks/scenarios/`      | Deterministic payment outcomes                 |
| `src/mocks/assets/`         | Removable demo images and video                |
| `src/mocks/devtools/`       | Dev helpers                                    |
| `src/mocks/manifest.json`   | Exact ownership for cleanup                    |
| `scripts/devdata/`          | validate / remove                              |
| `src/core/migrations/`      | Retained purge of legacy mock namespaces       |

## Commands

```bash
npm run devdata:validate   # confirm mock sources exist
npm run devdata:remove     # dry-run list of owned paths
npm run devdata:remove -- --execute   # delete owned source paths
```

## Bundled demo media

All demo binaries live under `src/mocks/assets/`, are listed in `src/mocks/manifest.json`, and are reached through `src/mocks/assets/index.ts`. The profile, Computer Fundamentals course, ISRO demo article, lesson player, and live-room recording exercise these assets.

- The three PNG files are AI-generated, fictional development artwork with no logos or real-person identity.
- `redi-demo-lesson.mp4` is the 1 MB CC0/public-domain H.264 fixture from `https://cdn.truefilesize.com/mp4/sample-1mb.mp4`.
- Verified video SHA-256: `5186e6750a63252088258d3bb757707e462316ba25f61ed7059763211a7e0587`.

These files are development fixtures, not production course content. API mode receives media URLs and playback authorization from the backend.

## Future instruction: “Remove all dummy data”

That phrase means: run the full cleanup in the development-data prompt — delete manifest-owned sources, repair composition to API-only, keep the migration, verify the build. **Do not remove the dataset until that instruction is given.**

After removal:

1. `REDI_DATA_SOURCE=api` / release builds only
2. Empty/error states when the backend is missing — no restored samples
3. `purgeMockNamespaces` still runs once on upgraded installs
