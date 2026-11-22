# Handover 19 — Checkout coupon breaks the order screen

Learner base: `https://redi-api-production.up.railway.app/api`  
Checked: 22 Nov 2026. The app never calls `/admin/*`.

Related: [10-admin-courses-pricing](./10-admin-courses-pricing.md) (rupee price on the course), `docs/flows/06-checkout-payments.md`, `docs/ADMIN_PANEL_AND_BACKEND_API_HANDOVER.md` §9.7.

Screenshot: `To make change/Screenshot 2026-11-22 122842.png`.

---

## What the learner sees

Checkout opens with **no order summary and no coupon box**. Two cards and a dead pay button:

| On screen | Source |
|---|---|
| Couldn’t load this — **Could not load this order.** — Retry | `src/screens/payments/CheckoutScreen.tsx` when the quote query is in error and there is no price |
| Payments are encrypted in transit… | Always on checkout |
| Couldn’t load this — **This purchase is currently unavailable. Please try again later.** — Retry | Same screen when there is no in-app payment method and no Play product |
| **Pay to Enroll** (orange, not tappable) | No payable amount, so the button falls back to this label and stays disabled |

Retry calls the same quote again, so the screen does not recover.

The coupon field is not on this screen. It is rendered only after a quote that includes payment methods (`inAppCheckout`). A failed quote removes that field, so the learner never sees “This coupon could not be applied.”

---

## Why it happens

Applying a code calls `POST /checkout/quote` with the course id and the coupon (`useCheckout.submitCoupon` → `commerce.quote`).

That route is **not deployed**. Production responds:

```http
POST /api/checkout/quote
Content-Type: application/json

{"productId":"cmw3vzvuj0022v3902sx34gsy","coupon":"TEST10"}
```

```http
HTTP/1.1 404 Not Found

{"message":"Cannot POST /api/checkout/quote","error":"Not Found","statusCode":404}
```

The same 404 is returned with no coupon, and with a bearer token. There is no `/api/coupons`, `/api/payments/quote`, or `/api/payments/apply-coupon`.

What does exist:

| Call | Result on 22 Nov 2026 |
|---|---|
| `GET /api/payments/config` | 200, Razorpay test mode, `configured: true` |
| `POST /api/payments/create-order` | Route exists. 401 without a bearer token |
| `GET /api/courses` | Paid test course **GST Basics** `cmw3vzvuj0022v3902sx34gsy`, `price.amountMinor` **100** (₹1) |

The quote query in `src/features/payments/hooks/useCheckout.ts` treats only `404` / `405` / `501` / `feature_unavailable` as “commerce not deployed” and then shows the catalogue price. Any other failure (401, 400, 422, 500, timeout, or a 404 that is not recognised as an `AppError`) sets `quote.isError` and clears the price. That is exactly the screenshot: both error cards, no coupon box, Pay to Enroll.

A coupon error is supposed to stay under the coupon field (`couponFailureMessage` in `src/features/payments/couponQuote.ts`). That copy is unreachable once the quote query has already failed, because the field is unmounted.

---

## Fix

Two changes. The API must own the price. The app must keep checkout on screen when a code cannot be applied.

### 1. API — `POST /api/checkout/quote`

Auth: `Authorization: Bearer <accessToken>`.  
Body: `{ "productId": "<course id>", "coupon": "OPTIONAL" }`.  
`productId` is the course id the app already sends (`checkout.productId`, same id as `GET /courses`).

Success is **200** and the resource itself (the app reads `response.data`, not a `{ data: ... }` wrapper).

Money is integer **paise**. ₹1 → `100`. ₹499 → `49900`.

```json
{
  "productId": "cmw3vzvuj0022v3902sx34gsy",
  "title": "GST Basics for Small Business",
  "mrpMinor": 100,
  "discountMinor": 0,
  "coupon": "WELCOME50",
  "couponDiscountMinor": 50,
  "totalMinor": 50,
  "currency": "INR",
  "expiresAt": "2026-11-22T08:15:00.000Z",
  "methods": ["upi", "card", "netbanking", "wallet"]
}
```

Rules the app already enforces in `quoteWithCoupon`:

1. `coupon` must be the same code the learner sent. The app uppercases it before the request. Compare case-insensitively, echo it in uppercase.
2. `couponDiscountMinor` must be an integer **greater than 0**. Zero, missing, or a rupee amount in this field is rejected and the listed price stays.
3. `totalMinor` is the amount **after** the coupon, integer, `>= 0`. `totalMinor + couponDiscountMinor` is the selling price before the coupon.
4. `methods` must be a non-empty subset of `upi`, `card`, `netbanking`, `wallet`. An empty or missing list hides the coupon box and the payment methods. With no Play product id, the screen then shows **This purchase is currently unavailable.**
5. `expiresAt` must be a future ISO-8601 time (15 minutes is enough). A past time disables Pay.
6. `currency` is `INR`.
7. Recompute the discount on the server from the published course price. Do not trust a client amount.
8. No coupon in the body → omit `coupon` and `couponDiscountMinor` (or send `0`) and return the normal selling price. This call must succeed for every published paid course. It is what opens checkout.

Invalid or ineligible code — **400**, not 404 and not 500:

```json
{
  "code": "invalid_coupon",
  "message": "This coupon is not valid for this purchase.",
  "retryable": false
}
```

Use a sentence a learner can read (`expired`, `not valid for this course`, `usage limit reached`). The app shows `message` on 400 / 422.

Do not return **404** for a bad code. A 404 whose body has no `code` is treated as “this route is not deployed” (`Cannot POST /api/checkout/quote`). Do not return **500** for a bad code. 500 is shown as a connection problem.

Also accept the code on the order the app already creates:

```http
POST /api/payments/create-order
Authorization: Bearer <accessToken>
Idempotency-Key: order-<courseId>-<unique>
Content-Type: application/json

{
  "amount": 50,
  "currency": "INR",
  "courseId": "cmw3vzvuj0022v3902sx34gsy",
  "coupon": "WELCOME50",
  "method": "upi"
}
```

Whitelist `coupon`, `method`, `currency`, and `courseId`. If validation says `property coupon should not exist`, the app **retries the order without the coupon** and the learner is charged the unreduced price (`createOrder` in `src/core/api/httpRepositories.ts`).

The Razorpay order amount must be the discounted `totalMinor`. The JSON must include a Razorpay order id (`id` or `orderId` starting with `order_`). Without that id the app stops with “Payment could not be started.” Same `Idempotency-Key` must return the same order, not a second charge.

Record the coupon on the order only when payment is verified. A cancelled checkout must not burn a single-use code.

### 2. App — a bad coupon must not blank checkout

Files: `src/features/payments/hooks/useCheckout.ts`, `src/screens/payments/CheckoutScreen.tsx`, `src/features/payments/couponQuote.ts`, `src/core/api/httpRepositories.ts`.

1. Keep the catalogue price on screen when `POST /checkout/quote` fails. Do not leave `quote.data` empty, and do not set the quote query to error, for a coupon attempt. Coupon failures stay in `couponError`.
2. Keep the coupon field mounted whenever checkout has a price. Do not hide it just because `methods` is missing.
3. Show only one error card. “Could not load this order.” and “This purchase is currently unavailable.” must not both appear for the same failed quote.
4. Map `404` + `Cannot POST /checkout/quote` to: “Coupon codes are not available for this purchase yet. The listed price is unchanged.” Do not replace the order with the two cards.
5. Stop the create-order retry that drops `coupon` after `should not exist`. Until the API accepts `coupon`, fail the pay action with a clear message. Do not open Razorpay at the full price after the learner applied a code.
6. After a quote is accepted, Pay must send `appliedCoupon` and `data.totalMinor` from that quote. Ignore a code that the server did not echo.

---

## Admin

Staff need a coupon on the paid course (GST Basics is the current ₹1 test course):

| Field | Rule |
|---|---|
| Code | Unique, stored uppercase. Learner types any case |
| Type | Percent or fixed paise |
| Amount | Percent 1–100, or fixed paise `>= 1` and `<` course price |
| Course | This course id, or all paid courses. A code for another course is `invalid_coupon` |
| Window | `startsAt` / `endsAt`. Outside the window is `invalid_coupon` |
| Limits | Total uses and per-learner uses. Count a use only after payment is verified |
| Status | Active / disabled |

Do not ask staff to type paise. They type rupees; the API stores paise.

---

## Acceptance

- [ ] `POST /api/checkout/quote` with a bearer token and a published paid course id returns 200 and the JSON above, including `methods` and a future `expiresAt`.
- [ ] The same call with a valid code echoes `coupon` and a `couponDiscountMinor` greater than 0, and `totalMinor` is the reduced paise amount.
- [ ] An unknown, expired, or wrong-course code returns **400** `invalid_coupon` and a readable `message`. The no-coupon quote for that course still returns 200.
- [ ] `POST /api/payments/create-order` accepts `coupon` and creates a Razorpay order for `totalMinor`, not the pre-coupon price.
- [ ] Repeating the same `Idempotency-Key` does not create a second Razorpay order.
- [ ] Checkout on GST Basics shows the order summary and the coupon field. Apply does not replace that screen with the two “Couldn’t load this” cards.
- [ ] A bad code leaves the ₹ price unchanged and shows the server message under the field. Remove clears it.
- [ ] A good code shows the reduced total. Pay opens Razorpay for that reduced amount. Cancelling does not consume the code.
