# iOS setup (RN 0.87.1)

iOS **cannot be built on Windows**. Use a Mac with a supported Xcode for this RN version (see the official environment doc for 0.87).

```bash
cd ios
bundle install
bundle exec pod install
cd ..
npx react-native run-ios
```

CocoaPods remains the default; SwiftPM is experimental in 0.87 and is not used here.

Bundle ID: `com.rediapp.learner` (from `--package-name`). Display name: REDI.

Add GoogleService / URL schemes only after the backend confirms Google exchange.

Info.plist includes camera, photo library, microphone usage strings and bundled fonts.
