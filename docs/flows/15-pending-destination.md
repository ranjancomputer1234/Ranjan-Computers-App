# 15. Pending destination

## Purpose

If a guest (or logged-out user) taps a protected action, remember **what** they wanted without granting it.

## Write

`setPendingDestination({ kind, id })` then `showLogin()`.

Used from course CTA, test start, and notification open.

## After login

`TabNavigator` runs `usePendingDestinationReplay`:

- course → Home stack CourseDetail
- test → TestInstructions
- liveClass → Live room
- news / fact / interview / exam → matching detail

Then the destination is cleared.

## What it does not do

- Auto-pay
- Auto-enroll as purchased
- Auto-submit an attempt

The opened screen re-evaluates access. Purchase still requires checkout.
