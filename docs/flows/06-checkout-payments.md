# 6. Checkout and payments

## Purpose

Collect money only through a provider + backend verify. The app never marks a course purchased from a client flag.

## Sequence

1. Recheck entitlement (`commerce.entitlements` / course access).
2. Authoritative quote `POST /checkout/quote` (coupon recalculates totals).
3. Create or recover order with `Idempotency-Key` persisted per account (`idem.{productId}`).
4. `PaymentService.launch` — **mock success in development**. Production must use Razorpay / Play Billing / App Store once chosen.
5. `POST /payments/verify` with provider payload.
6. UI success only if order `succeeded`.
7. If paid but access not yet granted → Payment Pending. Refresh. **Do not charge again.**
8. User cancel ≠ failure.

## States

`idle → creatingOrder → awaitingProvider → verifying → paidAccessPending | succeeded | cancelled | failed | unknownNeedsRecheck`

## After success

Navigate to My Learning. Access appears only when the backend (or mock verify) says so.

## Honest copy

Design-board refund slogans are not shipped as legal guarantees. Checkout shows that production policy text comes from the institute/provider.

## History

Profile → Payment History → Order Detail. Subscription screen states it is not a live plan until the backend says so.
