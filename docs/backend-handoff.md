# Backend / admin handoff

> The complete, current implementation handover is
> [`ADMIN_PANEL_AND_BACKEND_API_HANDOVER.md`](./ADMIN_PANEL_AND_BACKEND_API_HANDOVER.md).
> This shorter file is retained as the production-decision checklist.

Please return answers against the live system. Until then the app runs on labeled fixtures.

## Required to go live

1. Base URLs (dev/staging/prod), API versioning, error envelope samples.
2. Auth: phone/password vs OTP, refresh rotation, logout, Google token exchange, verified email/phone rules.
3. Sample sandbox learner accounts (not production people).
4. Catalogue IDs, ordering, free/paid/preview, **whether free Tally and certification Tally are distinct products**.
5. Progress: completion rule, overall vs current-semester fields, resume position format.
6. Semester prerequisites, review trigger (auto vs `submit-review`), rejection/resubmit.
7. Test schema, marking, attempt limits, answer save revision, atomic submit, solution release.
8. Video/live provider, join token TTL, DRM/offline, chat transport, hand-raise, recordings.
9. Payment route (Play Billing / App Store / India UPI gateway), quote/order/idempotency/verify, receipts, subscriptions if any.
10. Push provider, inbox vs push, Clear All semantics, deep-link target kinds.
11. Download/upload limits, checksums, offline licence window.
12. Issued document states, PDF URLs, QR payload, official seals, revocation.
13. Languages, theme preference ownership, support contacts, current legal copy, capability flags.

## Explicitly out of mobile scope

Admin dashboard, database, payment secret verification, document issuance, and video origin servers.
