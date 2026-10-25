# 2. Authentication

## Purpose

Create a REDI learner session. Native Google success alone is never a REDI session.

## Login (app → server)

1. Phone must be 10 digits; password min 8 characters (Zod + RHF).
2. `POST /auth/login` `{phone, password}`.
3. Persist tokens in Keychain. Remember `guestMode=false`.
4. Store profile in Zustand. Switch root to Main tabs.
5. Replay [pending destination](./15-pending-destination.md) if one was stored.

**Mock fixture:** phone `9876543210`. The password stays in the gitignored `.env`.

Passwords are never logged.

## Register

1. Name, phone, password → `POST /auth/register` → `challengeId`.
2. Verify OTP (`123456` in mock) → session tokens.
3. Invalid OTP shows a field error, not a silent success.

## Forgot / reset

1. Phone → challenge.
2. OTP → new password.
3. Return to Login. Existing sessions are not assumed.

## Google

1. If `REDI_GOOGLE_WEB_CLIENT_ID` is missing, the button explains that Google is unavailable.
2. If present, the native SDK must still `POST /auth/google/exchange` with an ID token.
3. The app never treats a Google profile as Deepak or any other fixture user.

## Logout

1. `bumpSessionGeneration()` so in-flight HTTP cannot write into the next account.
2. Wipe Keychain and memory tokens.
3. Remove Query keys `learner`, `attempt`, `home`.
4. Clear pending destination.
5. Root stack shows Login.

## 401 during an authenticated session

See [session refresh](../process/session-refresh.md). Revoked refresh logs out. Timeout is offline, not logout.
