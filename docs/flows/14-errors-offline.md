# 14. Errors, offline, empty

Mapped in `src/core/api/http.ts` → `AppError`.

| Signal | UI |
| --- | --- |
| No network | Offline banner / retry; keep suitable cache |
| Timeout | Offline, **keep** credentials |
| 401 after failed refresh | Logout |
| 403 | Real restriction copy (login, purchase, prerequisite, pending verify) |
| 404 | Missing content |
| 429 | Honor Retry-After when present |
| 5xx | Retryable |
| Empty list | Dedicated empty copy, not a skeleton forever |
| Non-idempotent POST | Not blindly retried |

Catalogue, home banner, and lesson player fail independently.

Zod login errors stay on fields. Server `fieldErrors` should map the same way when the API exists.
