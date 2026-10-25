# 13. Profile and settings

## Profile

Authenticated: `GET /me`, stats, achievements, issued admit-card teaser, shortcuts (courses, results, certificates, downloads, help).

Guest: Login CTA only. Never Deepak’s photo, roll number, or certificate.

## Edit profile

One submit path `PATCH /me`. Display name is editable. Photo picker is wired to image-picker capability; production storage is backend-owned.

Currently Learning / streak freeze cannot grant access.

## Settings

Grouped Account / Learning / App rows match HTML screen 21 (icon tiles, subtitles, clay toggles, chevrons, red Logout, version line).

| Control | Storage | Honesty |
| --- | --- | --- |
| Wi-Fi only downloads | preference | Applied to download adapter and Downloads copy |
| Video quality | preference | Applied to lesson `maxBitRate` |
| Learning reminder | preference + local notification | Opt-in daily device reminder at the selected local time. Permission is requested only after the learner enables it; unsupported native builds retain the app-open fallback |
| Streak Freeze | n/a | Row is visible; toggle stays off. No client-generated freeze |
| Dark mode | preference | On = force dark chrome; off = follow system |
| Language | preference | Settings chrome translations only (`en` / `hi`). Course/news/test bodies stay in published language |
| Notifications | preference | Local learning/live-class reminders work on-device. Remote classes/tests/offers push remains unavailable until a provider is configured; inbox is always available |
| Subscription | n/a | Free plan; HTML ₹199/month is not a live entitlement |
| Logout | session | Full wipe |

Legal documents: `GET /legal/{slug}` (privacy, terms). Help is `GET /support`.
