# 8. Semesters

## Offering

`course-tally-cert` is the purchased certification track. It is not the free Tally Prime course.

## Outline

Lists semesters with status: `in_progress` | `locked` | `pending_review` | `requirements_complete`.

Progress percent, tests, projects, and admin review are **separate facts**. Completing videos does not unlock the next semester.

## Content

Available semester → lessons and projects.

Locked semester: 403 from `semester()` mock; UI explains why; deep links must not leak content.

## Project

Written submission (and future file id). Upload ≠ accepted project. Institute still reviews.

## Wait screen

When status is pending review, root `SemesterWait` shows an hourglass icon and checklist. **The app cannot approve itself.** A notification is only a refetch signal.

Rejected (when backend exists): show feedback + resubmit path. Mock currently keeps semester 2 locked with an unlock reason string.
