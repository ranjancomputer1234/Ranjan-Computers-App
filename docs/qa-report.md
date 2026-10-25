# QA report

Date: 2026-09-13  
App: REDI learner (`com.rediapp.learner`)  
Host: Windows 10, Node 24.13.1, OpenJDK 17, Android SDK present, emulator `emulator-5554`

## Checks run

| Check | Result |
| --- | --- |
| Project init `@react-native-community/cli@latest` | Pass — React Native 0.87.1, React 19.2.3 |
| `npx react-native-asset` (fonts) | Pass — Inter, Caveat, JetBrains Mono linked |
| `npm run typecheck` (`tsc --noEmit`) | Pass |
| `npx eslint . --ext .js,.jsx,.ts,.tsx --quiet` | Pass (0 errors) |
| `npm test` | Pass — 2 suites, 10 tests |
| Android native package path | Corrected to `com/rediapp/learner` |
| Android `assembleDebug` / `run-android` | Pass with **embedded JS** (`redi.useEmbeddedJs=true`) — avoids Metro `ProtocolException` / “Downloading 100%” hang on Windows emulator. Login + demo account verified after Hermes warmup. |
| iOS build | **Not run** (Windows host, no Xcode) |
| Visual HTML crop comparison on a 390dp device | **Not measured** — layouts implemented from the HTML, not pixel-audited on hardware |
| Live payment gateway | **Not tested** — mock `PaymentService` |
| Live video CDN of REDI | **Not tested** — public sample MP4 in fixtures |
| Notifications | Remote push adapter remains `none`; local learning/live-class reminder bridge added and Android Kotlin compile passes |
| Google Sign-In | Unavailable until client IDs + backend exchange exist |

## Unit tests covered

- Account-scoped query keys
- Error mapping (`unknown` is not retryable)
- Invalid vs fixture login
- States & Capitals paid catalogue vs granted detail access
- Free Tally vs certification Tally split (20 vs 34 lessons)
- Locked semester 403
- Checkout idempotency key reuse
- Duplicate attempt submit returns the same result

## Critical flows (mock)

| Flow | Outcome |
| --- | --- |
| Guest vs Deepak cache | Guests never load `learner` queries; logout clears `learner` / `attempt` / `home` |
| Login fixture | Phone `9876543210` / password in local `.env` only |
| Pending destination | Stored as `ContentRef`, replayed after login, access re-checked |
| Paid access | Locked lessons/tests go to checkout, not a client unlock |
| Semester | Locked semester `403`; wait screen cannot self-approve |
| Purchase idempotency | Same key returns the same order |
| Duplicate submit | Second submit returns existing result |

## Device

- Emulator: `Pixel_4` API 30 (`emulator-5554`)
- Install: `Installed on 1 device` (`app-debug.apk`)
- Metro: `http://localhost:8081` with `adb reverse tcp:8081 tcp:8081`
- iOS: not built (Windows)

For faster local Android builds, limit ABIs, for example:

```
reactNativeArchitectures=x86_64
```

in `android/gradle.properties` (or `-PreactNativeArchitectures=x86_64`). Do not ship a single-ABI setting in a store release.

## Remaining limitations

Backend contract missing. Store billing not selected. DRM offline not claimed. Speech search unavailable. Dark theme preference is stored but not applied app-wide. HTTP repositories are proposed, not live-verified.
