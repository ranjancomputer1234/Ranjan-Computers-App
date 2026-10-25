# API integration

**No OpenAPI, Postman collection, or sandbox credentials were supplied.** Paths below are a **proposed** REST/JSON shape for handoff. The HTTP client will use the backend’s real URLs once provided. Status key: `proposed` | `missing` | `confirmed` | `integrated-and-verified`.

Owner: **mobile** consumes; **backend/admin** owns data, auth, entitlements, scoring, documents, and payments.

| Capability | Consumer screens | Method / path (illustrative) | Auth | Pagination | Cache / invalidate | Status |
| --- | --- | --- | --- | --- | --- | --- |
| App config | Launch | `GET /v1/app-config` | no | — | long | proposed |
| Login | 32 | `POST /v1/auth/login` | no | — | session | proposed |
| Register | Register | `POST /v1/auth/register` | no | — | — | proposed |
| Verify challenge | OTP | `POST /v1/auth/challenges/{id}/verify` | no | — | session | proposed |
| Password forgot/reset | Recovery | `POST /v1/auth/password/forgot|reset` | no | — | — | proposed |
| Google exchange | Login | `POST /v1/auth/google/exchange` | no | — | session | missing |
| Refresh / logout | Session | `POST /v1/auth/refresh`, `POST /v1/auth/logout` | refresh | — | clear private | proposed |
| Me | 19, 29 | `GET/PATCH /v1/me` | yes | — | profile, home | proposed |
| Home | 01 | `GET /v1/home` | mixed | — | short | proposed |
| Catalogues | 02–06, 11 | `GET /v1/categories?kind=` | mixed | cursor | minutes | proposed |
| Search | 08 | `GET /v1/search` | mixed | cursor | short | proposed |
| Course / lessons / reviews | 09, 10 | `GET /v1/courses/{id}` … | mixed | reviews cursor | progress invalidation | proposed |
| Enroll | 09 | `POST /v1/courses/{id}/enroll` | yes | — | enrollments | proposed |
| Playback session | 10, 07 | `POST /v1/lessons/{id}/playback-session` | yes | — | — | missing provider |
| Progress / complete | 10 | `POST /v1/lessons/{id}/progress\|complete` | yes | — | home, learning | proposed |
| Bookmarks | 15–18 | `GET/PUT /v1/me/bookmarks/...` | yes | — | saved | proposed |
| Exams / tests / attempts | 12, 13, 26 | tests + attempts | yes for start | — | results | proposed |
| News / awareness / facts | 04–06, 14–17 | `/v1/news`, `/awareness`, `/facts` | mixed | cursor | minutes | proposed |
| Live | 07, 27 | `/v1/live-classes` + join + hand | yes to join | — | live short | missing provider |
| Semesters / projects | 24, 25 | enrollments semesters | yes | — | outline | proposed |
| Quote / order / verify | 22, 23 | checkout + payments | yes | — | entitlements | missing provider |
| Notifications | 20 | `/v1/me/notifications` | yes | cursor | inbox | missing push |
| Documents | 30, 31 | `/v1/me/documents` | yes | — | profile banner | proposed |
| Downloads | 28 | download-authorization | yes | — | downloads | missing DRM policy |
| Support / legal | Help | `/v1/support`, `/v1/legal/{slug}` | no | — | long | proposed |

### Envelope (proposed)

Success: resource JSON. Errors: `{ code, message, fieldErrors?, requestId? }`. Pagination: `{ items, nextCursor, total? }`. Money: integer minor units + currency.

### Authoritative fields

Prices, access, scores, ranks, semester unlock, document verified flags, and progress totals **must** come from the API. The client never grants them.

DTO mapping lives at the repository boundary (`src/core/api/httpRepositories.ts` and `src/mocks/repositories.ts`).
