# Native adapters

All live in `src/core/services.ts`. Screens never import Razorpay/FCM SDKs directly.

## PaymentService

Dev: mock `succeeded` after launch.

Production route is config (`razorpay` | `play_billing` | `app_store`) but **not implemented** until credentials exist.

Cancel is a first-class status.

## Video

`react-native-video` with fixture or authorized URL. No DRM claim.

## Live

Same player after `join`. Chat/hand are REST flags.

## Download

Authorize URL + `react-native-blob-util`. Queue states as documented in downloads flow.

## Share

`react-native-share` / OS sheet.

## Speech search

Disabled unless `REDI_SPEECH_ENABLED=true`. No pretend microphone results.

## Push

`pushProvider: 'none'`. Inbox still works. The `RediReminders` native bridge schedules local daily-learning and live-class alerts; it does not register a remote push token.
