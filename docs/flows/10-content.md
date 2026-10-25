# 10. News, awareness, facts, interview

## News

Feed by category. Featured story from `featured` flag. Article body requires entitlement when `access` is purchase/login denied.

Share uses the OS share sheet with title, not a fabricated public URL.

## General awareness

Topics use schema variants: `pairs`, `list`, `article`.

States & Capitals: search must match **label and value** (state and capital). Catalogue paid badge vs granted detail access is documented, not “fixed” by inventing a paywall the HTML detail does not have.

## Facts

List + detail. Reactions are idempotent PUT + query invalidation.

“Take a Quiz” only if `quizId` exists.

## Interview prep

Categories include Mock Interview 1-on-1 as a **product CTA** (checkout), not an AI interviewer or calendar booking.

Questions list and detail are published content.

## Premium bodies

Fetch full body only after access is granted. Guests see catalogue cards and login/purchase CTAs.
