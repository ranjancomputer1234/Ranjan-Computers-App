# 9. Live classes

## Schedule

`GET /live-classes?from&to` for the selected day. Count = rows with `status=live`. Times are fixture IST labels.

Statuses: live, scheduled, ended, cancelled.

## Join

`POST /live-classes/{id}/join` → playback URL if authorized.

Native player. Chalkboard is waiting art, not the class.

Unauthorized join → error + retry, not a silent room.

## In-room

- Chat: body + `clientId` correlation. Messages can be pending/fail.
- Raise hand: API flag, **not** a microphone grant.
- Remind me: reminder flag on scheduled items plus an on-device notification 15 minutes before the class. Existing enabled reminders are restored when the schedule reloads.

## After

Ended + `recordingAvailable` → watch the same room with recording URL when provided.

Cancelled / not live → honest card state.

Remote push for “class starting” is optional. Local reminders work without it; inbox remains source of truth.
