# REDI notification system

This document is the handoff contract for the learner app, REDI API, and admin portal. The learner app implementation is in this repository. The backend and admin portal are separate projects and must implement the endpoints and publish workflow below.

## Delivery model

The backend inbox is the source of truth. Firebase Cloud Messaging (FCM) is only the Android delivery/wake-up channel.

1. An admin creates a draft in the portal and selects an audience, category, priority, action, and delivery time.
2. The backend validates and stores the notification, resolves the audience into immutable recipients, and creates one inbox row per learner.
3. A worker sends a **data-only** FCM message to active Android Firebase Installation IDs (FIDs).
4. Android renders the message in the matching system channel. Tapping it opens the linked app content.
5. The app refreshes `GET /v1/me/notifications`; read state is stored by the backend and therefore stays consistent across devices.

Do not make FCM the durable store. Delivery can be delayed, duplicated, or omitted, while the inbox must remain complete.

## Learner API

All endpoints require a learner access token.

### Inbox

`GET /v1/me/notifications?cursor=&category=all`

```json
{
  "items": [{
    "id": "ntf_01K...",
    "title": "Class timing changed",
    "body": "Computer Fundamentals starts at 11:00 AM today.",
    "createdAt": "2026-09-24T13:15:00Z",
    "read": false,
    "category": "classes",
    "source": "admin",
    "priority": "high",
    "actionLabel": "Open class",
    "target": {"kind": "liveClass", "id": "live_123"}
  }],
  "nextCursor": null,
  "total": 1
}
```

- Categories: `classes`, `tests`, `news`, `offers`, `system`.
- `system` is used for security, account, payment, and service messages and cannot be disabled.
- The server must omit expired, deleted, and unauthorized targets.
- Cursor ordering is `(created_at DESC, id DESC)`.

`PATCH /v1/me/notifications/{id}` with `{"read": true}` must be idempotent and scoped to the authenticated learner.

`POST /v1/me/notifications/clear` marks all current messages read (recommended) or archives them and returns `{"mode":"mark_read"}` or `{"mode":"archive"}`.

### Android device registration

`PUT /v1/me/push-devices/current`

```json
{
  "installationId": "FIREBASE_INSTALLATION_ID",
  "provider": "fcm",
  "platform": "android",
  "appVersion": "1.0.0",
  "locale": "en",
  "timezone": "Asia/Calcutta",
  "categories": ["classes", "tests", "news", "offers"]
}
```

Upsert by `(provider, installation_id)`, transfer the FID to the currently authenticated learner, and update `last_seen_at`. Store identifiers encrypted at rest. Never log a full FID.

`POST /v1/me/push-devices/unregister` with `{"installationId":"..."}` removes only an installation belonging to the authenticated learner. Also remove identifiers when FCM returns `UNREGISTERED` or another permanent invalid-target response.

## Admin portal contract

Restrict all routes to staff roles with MFA. Suggested permissions are `notifications.view`, `notifications.compose`, `notifications.approve`, and `notifications.cancel`. A composer must not be able to approve their own high-priority broadcast.

### Create and publish

`POST /v1/admin/notifications`

```json
{
  "title": "Class timing changed",
  "body": "Computer Fundamentals starts at 11:00 AM today.",
  "category": "classes",
  "priority": "high",
  "audience": {"type": "course", "courseIds": ["course_123"]},
  "target": {"kind": "liveClass", "id": "live_123"},
  "actionLabel": "Open class",
  "scheduleAt": "2026-09-24T13:15:00Z",
  "expiresAt": "2026-09-24T17:30:00Z"
}
```

Supported audience types should be `all`, `learner_ids`, `course`, `batch`, and `segment`. Before publish, the portal must show the resolved recipient count, local delivery time, Android preview, in-app preview, and any learners excluded because of category preferences. `system` messages ignore category preferences but require the stronger approval permission.

Recommended admin operations:

- `GET /v1/admin/notifications` — drafts, scheduled, sending, sent, cancelled.
- `GET /v1/admin/notifications/{id}/preview` — resolved count and sample payload.
- `POST /v1/admin/notifications/{id}/publish` — enqueue immediately or at `scheduleAt`.
- `POST /v1/admin/notifications/{id}/cancel` — cancel only work not already delivered.
- `GET /v1/admin/notifications/{id}/metrics` — recipients, FCM accepted, invalid tokens, opened, read.

Every create, edit, approval, publish, and cancel operation must write an immutable audit record containing actor, timestamp, request id, and before/after values.

## FCM payload

Send from a trusted backend with the Firebase Admin SDK or FCM HTTP v1 API. Never place a service-account key in the app or admin browser. Use a data-only payload so REDI owns the channel, icon, display, and tap behavior consistently.

```json
{
  "message": {
    "fid": "FIREBASE_INSTALLATION_ID",
    "data": {
      "notificationId": "ntf_01K...",
      "title": "Class timing changed",
      "body": "Computer Fundamentals starts at 11:00 AM today.",
      "category": "classes",
      "targetKind": "liveClass",
      "targetId": "live_123",
      "sentAt": "1790245500000"
    },
    "android": {
      "priority": "high",
      "ttl": "15300s",
      "collapseKey": "ntf_01K..."
    }
  }
}
```

Keep payloads non-sensitive because lock-screen visibility and device compromise cannot be controlled by the backend. The app validates category and target kind, truncates visible fields, uses private lock-screen visibility, and always re-fetches protected content through authenticated APIs.

## Android setup

1. Create Firebase Android app `com.rediapp.learner`.
2. Download `google-services.json` into `android/app/`. The file is intentionally not committed.
3. Build the app. Firebase support activates automatically when that file exists; mock builds continue to work without it.
4. Sign in and open Settings → Notifications → Enable alerts on Android 13+.
5. Verify all five system channels in Android App info → Notifications.
6. Publish a test message through the REDI admin flow and verify foreground, background, killed-app, tap/deep-link, token rotation, logout, and preference behavior.

The implementation uses Firebase BoM `34.19.0`, Messaging from that BoM, and Google Services plugin `4.5.0`. Review versions during normal dependency upgrades.

## Minimum backend tables

- `notification_campaigns`: content, category, priority, target, audience query, schedule, expiry, status, creator/approver.
- `notification_recipients`: campaign id, learner id, read/open timestamps, archived timestamp; unique `(campaign_id, learner_id)`.
- `push_devices`: learner id, provider, encrypted installation id, platform, app version, locale, timezone, enabled categories, last seen; unique `(provider, installation_id_hash)`.
- `notification_delivery_attempts`: recipient/device, provider message id, attempt, status, error class, timestamps.
- `admin_audit_log`: immutable actor and action history.

Use an outbox transaction when creating recipient rows, then let an idempotent worker fan out in bounded batches. Rate-limit admin publishing, cap title/body lengths, sanitize all text, validate target authorization, honor expiry, and deduplicate by campaign/recipient/device.
