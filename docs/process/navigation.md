# Navigation process

## Root stack groups

**Logged out:** Onboarding (first run only), Login, Register, ForgotPassword, VerifyContact, ResetPassword.

**In app** (`authenticated` or `guest`): Main (tabs) plus focused overlays:

- DailyQuiz, TestRunner
- Checkout, PaymentSuccess, PaymentFailure, PaymentPending
- SemesterWait

Focused overlays hide the tab bar.

## Tabs (fixed order)

Home, Live, Courses, My Learning, Profile.

Custom clay tab bar. Courses reuses Home stack screens plus `CoursesHome`.

## Optional params (React Navigation 7)

Screens with only optional fields are typed as `{ ... } | undefined` so `navigate('Search')` type-checks.

## Nested jumps

Checkout success: `Main → LearningTab → MyLearning`.

Pending destination replay: `Main → HomeTab|LiveTab → detail screen`.
