# Design decisions

## Tokens

Exact HTML values are in `src/theme/index.ts`. Clay variants map `clay-*` classes including lavender (`clay-lav`). Gradients use `react-native-svg` LinearGradient (verified against RN 0.87 New Architecture rather than an extra native gradient library).

Fonts are variable TTFs bundled as `Inter.ttf`, `Caveat.ttf`, `JetBrainsMono.ttf` with `fontWeight` mapping. Unsupported synthetic italic is not used.

## Reference discrepancies (do not treat as product rules)

| Issue | App behaviour |
| --- | --- |
| Home Tally 08/20 at 40% vs detail 12/34 ~35% | Two offerings: free `course-tally-prime` (20 lessons, 40%) and `course-tally-cert` (34 lessons, 35%) |
| Lesson title/number drift | Player uses the selected lesson entity |
| States & Capitals paid on 05, free on 16 | Catalogue keeps paid badge; detail access comes from entitlement (`granted` in the fixture with a documented exception) |
| Coupon saves ₹50 but total unchanged in HTML | Quote applies ₹50 off 549 → 499 |
| Live count vs rows | Count is derived from returned rows |
| Wrong highlighted tab on some HTML frames | Active tab follows navigator ownership |
| `.pfill` animation always 40% | Progress bar uses the actual percent |
| Sample SSL / 7-day refund / `redi.app/verify` | Not shipped as promises; documents say issued-record verification only |
| Deepak profile | Authenticated mock learner only; guests never see it |
| Dark mode | Inferred palette in `darkColors`; Settings toggle stores preference and applies it to screen chrome (background, headers, tab bar, status bar, Settings cards). No dark-screen HTML was supplied. |

## Native differences

- System status bar, keyboard, share sheet, and video controls are OS-owned.
- Inset/outset clay shadows use RN `boxShadow` strings. Older Android devices may flatten inset shadows; outer tinted shadow remains.
- Live player HTML controls are illustrative; `react-native-video` native controls are used inside the REDI chrome.
- Speech microphone shows an unavailable caption unless `REDI_SPEECH_ENABLED=true` and a native STT adapter is added.

## Inferred supporting screens

Auth, explore-all, test instructions/runner, document lists, payment pending/history, subscription honesty state, help/legal, and project submission use the same clay system without inventing extra marketing features.
