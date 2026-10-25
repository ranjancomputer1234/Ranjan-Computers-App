# 3. Guest mode

## Purpose

Let someone browse public catalogue without impersonating a stored learner.

## Enter guest (app)

`enterGuest()` wipes tokens, sets `guestMode=true`, removes `learner` queries, sets `status=guest`.

## What guests see

- Home greeting is **Learner**, never Deepak.
- Explore sections and free catalogue cards.
- Continue Learning is replaced by a “Start your first lesson” card.
- My Learning and Profile show a Login CTA, not another person’s enrollments, admit card, or certificates.
- Paid CTAs still go through access checks (login or purchase), never client-side unlock.

## What guests cannot do

- Save progress, bookmarks, or attempts as a durable account.
- See issued documents.
- Complete checkout as an anonymous success that grants access (login is required first).

## Upgrade

Protected action stores a `ContentRef`, calls `showLogin()`, and after a real login replays the destination and **re-checks** access. Login does not auto-pay or auto-submit a test.
