# Build and release

## Versions (creation time)

| Tool | Version |
| --- | --- |
| React Native | 0.87.1 |
| React | 19.2.3 |
| Node | 24.13.1 (engine >= 22.11) |
| TypeScript | 6.x |
| New Architecture | enabled |
| Application id | `com.rediapp.learner` |

## Fonts

Variable Inter, Caveat, JetBrains Mono in `src/assets/fonts/`.

After adding fonts: `npx react-native-asset`.

## Android

See `docs/android-setup.md`. Native Kotlin lives in `android/app/src/main/java/com/rediapp/learner/` (not the malformed `com/com.rediapp.learner` the CLI once generated).

`MainActivity` calls `super.onCreate(null)` for React Navigation.

## iOS

See `docs/ios-setup.md`. Cannot be built on Windows.

## Release checklist

- `REDI_DATA_SOURCE=api`
- Real `REDI_API_BASE_URL`
- Upload keystore (never commit)
- Privacy / camera / photo usage strings already in Info.plist
- Do not ship mock fixture credentials
- Confirm payment + Google + push providers or leave UI as unavailable
