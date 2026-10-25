# Flow and process index

Learner-facing journeys live in `docs/flows`. Internal platform processes live in `docs/process`.

Backend-owned steps are marked **server**. Mobile-owned steps are marked **app**. No flow in this repository implements the admin portal.

## Product flows

| # | Flow | Document |
| --- | --- | --- |
| 1 | Cold start, bootstrap, session restore | [01-bootstrap.md](./01-bootstrap.md) |
| 2 | Login, register, OTP, Google, password reset, logout | [02-authentication.md](./02-authentication.md) |
| 3 | Guest browse vs authenticated learner | [03-guest-mode.md](./03-guest-mode.md) |
| 4 | Home, catalogue, search | [04-discovery-search.md](./04-discovery-search.md) |
| 5 | Free course enroll and playback | [05-free-learning.md](./05-free-learning.md) |
| 6 | Paid access, checkout, payment recovery | [06-checkout-payments.md](./06-checkout-payments.md) |
| 7 | Daily quiz and formal tests | [07-assessments.md](./07-assessments.md) |
| 8 | Semester curriculum, projects, wait | [08-semesters.md](./08-semesters.md) |
| 9 | Live schedule, join, chat, hand | [09-live-classes.md](./09-live-classes.md) |
| 10 | News, GK, facts, interview prep | [10-content.md](./10-content.md) |
| 11 | Downloads and uploads | [11-downloads-uploads.md](./11-downloads-uploads.md) |
| 12 | Inbox, admit cards, certificates | [12-notifications-documents.md](./12-notifications-documents.md) |
| 13 | Profile, settings, legal | [13-profile-settings.md](./13-profile-settings.md) |
| 14 | Loading, empty, offline, mapped errors | [14-errors-offline.md](./14-errors-offline.md) |
| 15 | Pending destination after login | [15-pending-destination.md](./15-pending-destination.md) |

## System processes

| Process | Document |
| --- | --- |
| Mock vs HTTP data source | [../process/data-source.md](../process/data-source.md) |
| Token storage and refresh | [../process/session-refresh.md](../process/session-refresh.md) |
| Query cache and keys | [../process/query-and-cache.md](../process/query-and-cache.md) |
| Navigation map | [../process/navigation.md](../process/navigation.md) |
| Payment / video / download adapters | [../process/adapters.md](../process/adapters.md) |
| Build, fonts, release | [../process/build-and-release.md](../process/build-and-release.md) |

A short combined outline remains in [system-flows.md](./system-flows.md).
