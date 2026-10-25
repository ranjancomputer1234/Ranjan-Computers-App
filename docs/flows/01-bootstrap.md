# 1. Bootstrap

## Purpose

Start the app without flashing Login or Home, restore a session if tokens exist, and bind connectivity/focus managers.

## Actors

Learner device. Keychain. AsyncStorage preferences. TanStack Query.

## States

`bootstrapping` → `loggedOut` | `guest` | `authenticated`

`recoveryRequired` exists on the session type for future forced re-auth. Restore currently prefers keeping tokens on transient `me()` failure.

## Sequence (app)

1. `index.js` loads `react-native-gesture-handler`, then `App`.
2. `AppRoot` mounts providers: gesture root, safe area, QueryClient, repository DI, error boundary.
3. `RootNavigator` calls `hydrate()`.
4. The branded animated splash plays while `status === 'bootstrapping'`. It completes its short intro and only exits after session restoration is ready.
5. Keychain tokens are read into memory (`hydrateTokens`).
6. If tokens exist: status becomes `authenticated`, then `GET /me` (mock `auth.me`) fills profile. A failed `me()` does **not** log the user out.
7. If no tokens and `guestMode` preference is true: `guest`.
8. Otherwise: `loggedOut` (Login group).
9. NetInfo drives Query online manager. AppState drives Query focus manager.

## Failure

| Condition | Result |
| --- | --- |
| Keychain read fails | Treat as no session, show Login or Guest preference |
| Network down during `me()` | Stay authenticated; profile screens retry |
| Render crash | Error boundary, no fake Home data |

## Screens

Animated REDI splash only. No auth screen or tab bar is mounted until both the intro and bootstrap complete.
