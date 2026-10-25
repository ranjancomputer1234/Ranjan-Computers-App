# 5. Free learning

## Happy path

1. Catalogue → Course Detail (access `granted` or enrollable).
2. Guest + enroll/progress needed → login (pending destination = course).
3. Authenticated enroll `POST /courses/{id}/enroll` if required.
4. Lesson Player: native `react-native-video` when `playbackUrl` exists.
5. Progress `POST` throttled (~15s) with position seconds.
6. Complete is a **server** fact (`POST .../complete`), not a local checkbox.
7. My Learning lists enrollments and bookmarks.

## Player UI

Chalkboard art is a poster, not the lesson. Tabs Notes / Q&A / Docs / Chat are placeholders until the backend supplies those collections.

Portrait player keeps the tab bar, matching the design board.

## Failure

| Condition | UI |
| --- | --- |
| 403 | Honest restriction (purchase/login/prerequisite) |
| Missing URL | Poster + retry, not a fake lecture |
| Offline with cache | Last lesson metadata; playback may fail honestly |
