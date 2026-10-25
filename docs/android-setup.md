# Android setup (RN 0.87.1)

Verified against [React Native 0.87](https://reactnative.dev/blog/2026/08/11/react-native-0.87) and [getting started without a framework](https://reactnative.dev/docs/getting-started-without-a-framework).

## Toolchain

| Tool | Required by 0.87 | This project |
| --- | --- | --- |
| Node | >= 22.13 | 24.13.1 |
| JDK | 17+ recommended | OpenJDK 17.0.18 |
| Android Gradle Plugin | 9 | from RN template |
| Kotlin | 2.0+ (template 2.2.0) | template |
| compileSdk / buildTools | 37 | template |
| minSdk | 24 | template |
| NDK | 27.1.12297006 | template |
| New Architecture | default on | `newArchEnabled=true` |

Do **not** mix arbitrary “latest” AGP/Kotlin/NDK outside the template.

## SDK

1. Install Android Studio and SDK 36/37, Build-Tools 37, Platform-Tools, emulator.
2. Set `ANDROID_HOME`.
3. Accept licenses: `sdkmanager --licenses`.
4. Start an emulator (API 34+ recommended for `boxShadow`).
5. From `REDIApp`: `npm run android`.

## Stuck on “Downloading 100%…” (fixed)

On Windows + Android emulator, Metro’s multipart/chunked JS download can fail with:

`ProtocolException: Expected leading [0-9a-fA-F] character but was 0xd`

The app then stays on the native download splash forever.

**Default fix in this repo:** `redi.useEmbeddedJs=true` in `android/gradle.properties`.

- Debug APKs **embed** `index.android.bundle` at build time.
- `MainApplication` sets `useDevSupport=false` so the emulator does **not** download from Metro.
- You do **not** need `npm start` for Android emulator runs when this flag is on.

### Live reload (Metro) again

1. Set `redi.useEmbeddedJs=false` in `android/gradle.properties`.
2. Prefer a **physical device** or a clean ARM emulator.
3. Run `npm start` then `npm run android`.
4. Avoid project paths with spaces when possible (`E:\Hritik App\...` can make Metro flaky).

## Permissions (manifest)

Internet, network state, notifications, camera, vibrate, read media images. Microphone is declared on iOS for future live audio; Android mic is requested only if a confirmed interactive live contract needs it.

## Signing

Debug keystore is the template default. Production needs a real upload keystore — never commit it.

## Demo login (mock)

Phone `9876543210` / password from the gitignored `.env` / OTP `123456`. On Login use **Login as Deepak**.
