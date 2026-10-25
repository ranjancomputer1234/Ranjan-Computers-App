# 12. Notifications and documents

## Inbox

`GET /me/notifications` is the source of truth. Push (`fcm`/`apns`) is configured as `none` until a provider exists.

Daily learning reminders and 15-minute live-class reminders are local device notifications, independent of remote push. They require explicit OS notification permission.

Open item → mark read → resolve typed `ContentRef` after access check. Guest opening a protected target stores pending destination and shows Login.

Clear All confirms, then API (`mark_read` semantics in mock).

## Admit cards and certificates

Read-only issued records from the admin portal. The learner app **cannot** generate hall tickets.

Statuses: issued | pending | revoked | not_issued.

QR is the issued payload, not a made-up `redi.app/verify` link.

`verified` is only shown when the record says so.

PDF download uses authorize-download then the system viewer/share sheet.
