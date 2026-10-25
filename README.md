# REDI — Ranjan Educational Institute (Learner App)

React Native **Community CLI** application for learners at Ranjan Educational Institute. The admin portal and backend are **separate projects**. This repository is the mobile client, plus proposed API boundaries and handoff documentation.

- **App name:** REDI
- **Package / application id:** `com.rediapp.learner`
- **React Native:** 0.87.1 (latest stable at project creation)
- **React:** 19.2.3
- **Node:** >= 22.13 (this machine used 24.13.1)
- **New Architecture:** enabled (RN 0.87 default)
- **Data source:** live HTTP API only. The backend contract still needs to be verified against the deployed service.

## Exact commands

```bash
cd REDIApp
npm install
npx react-native-asset
npm run android
```

Android emulator on Windows uses **embedded JS by default** (`redi.useEmbeddedJs=true`) so the app does not hang on Metro’s “Downloading 100%…” screen. You usually do **not** need `npm start` for Android.

For Metro live reload (physical device recommended): set `redi.useEmbeddedJs=false` in `android/gradle.properties`, then:

```bash
npm start
npm run android
```

`npm run typecheck`
`npm test`

iOS requires macOS, Xcode, and CocoaPods:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
npx react-native run-ios
```

## Environment

The Android build reads the gitignored project-root `.env`. It does not read `.env.example`. Server secrets in that file are never copied into the app.

## What works now

- All **32 reference screens** plus supporting auth, filters, curriculum, tests, payments recovery, documents, help/legal.
- Typed navigation (five tabs + focused root flows).
- Claymorphism design tokens from the HTML board.
- Typed HTTP repository boundary for the REDI backend.
- Android FCM delivery, category channels, system-tray deep links, and a durable in-app notification inbox.
- Honest unavailable states for Google login, speech search, store billing, and DRM.

## What is not live-tested

See `docs/qa-report.md` and `docs/backend-handoff.md`. No REDI backend, payment gateway, live provider, Firebase project, or admin portal was supplied, so those adapters are complete on the mobile side only. Add `android/app/google-services.json` to activate FCM; release builds require it.

## Documentation map

| Document | Contents |
| --- | --- |
| `docs/ADMIN_PANEL_AND_BACKEND_API_HANDOVER.md` | Authoritative combined admin-panel and backend/API implementation handover |
| `docs/architecture.md` | Modules, state, adapters |
| `docs/screen-inventory.md` | Screens 01–32 and supporting routes |
| `docs/design-decisions.md` | Tokens, HTML discrepancies, native differences |
| `docs/api-integration.md` | Proposed operations and status |
| `docs/notification-system.md` | Admin inbox, FCM delivery, Android channels, backend contract |
| `docs/backend-handoff.md` | Questions for the backend/admin team |
| `docs/qa-report.md` | Checks actually run |
| `docs/android-setup.md` / `docs/ios-setup.md` | Native toolchain |
| `docs/flows/` | Every product journey (bootstrap through pending destination) |
| `docs/process/` | Data source, tokens, cache, navigation, adapters, build |
