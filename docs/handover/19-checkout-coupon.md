# Handover 19 — Checkout coupon and Razorpay verify (server)

Learner base: `https://redi-api-production.up.railway.app/api`  
Checked: 22 Nov 2026. The app never calls `/admin/*`.

Related: [10-admin-courses-pricing](./10-admin-courses-pricing.md) (rupee price on the course), `docs/flows/06-checkout-payments.md`, `docs/ADMIN_PANEL_AND_BACKEND_API_HANDOVER.md` §9.7.

Screenshot: `To make change/Screenshot 2026-11-22 122842.png`.

The Razorpay React Native SDK, checkout options, and the verify request are already in the app. **The remaining checkout work is on the server**, plus two small app follow-ups listed at the end. The API owns the price, the Razorpay order, the signature check, and the payment-status check. The phone must not be trusted for any of those.

---

## What is still broken

`POST /api/checkout/quote` is not deployed. Production responds:

```http
POST /api/checkout/quote
Authorization: Bearer <accessToken>
Content-Type: application/json

{"productId":"cmw3vzvuj0022v3902sx34gsy","coupon":"TEST10"}
```

```http
HTTP/1.1 404 Not Found

{"message":"Cannot POST /api/checkout/quote","error":"Not Found","statusCode":404}
```

The same 404 is returned with no coupon. There is no `/api/coupons`, `/api/payments/quote`, or `/api/payments/apply-coupon`.

| Call | Result on 22 Nov 2026 |
|---|---|
| `GET /api/payments/config` | 200, Razorpay test mode, `configured: true` |
| `POST /api/payments/create-order` | Route exists. 401 without a bearer token. Coupon field is not accepted yet |
| `POST /api/payments/verify-payment` | App already posts the three Razorpay fields. Signature and payment-status checks are not confirmed on the server |
| `GET /api/courses` | Paid test course **GST Basics** `cmw3vzvuj0022v3902sx34gsy`, `price.amountMinor` **100** (₹1) |

Until the quote route returns 200, Apply cannot change the price. The app shows “Coupon codes are not available for this purchase yet. The listed price is unchanged.”

---

## What the app already sends

Money is integer **paise**. ₹1 → `100`. ₹499 → `49900`. The app uppercases the coupon before every request.

| Step | App call | Server must do |
|---|---|---|
| Price the order | `POST /checkout/quote` | Recompute MRP, coupon, and total. Return methods and a future `expiresAt` |
| Open Razorpay | `POST /payments/create-order` with `Idempotency-Key` | Create one Razorpay order for `totalMinor`. Accept `coupon` |
| Store the sheet result | `POST /payments/verify-payment` | Save `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` |
| Trust the payment | same verify call | Check the HMAC, then fetch the payment from Razorpay and require `captured` for the same paise amount |
| Free claim | quote with `totalMinor: 0` | Skip Razorpay. Grant access and count the coupon. See §4 |

A bad coupon is **400** `invalid_coupon` with a sentence the learner can read. **404** with no `code` means “route not deployed”. **500** is shown as a connection problem.

---

## Server work

### 1. `POST /api/checkout/quote`

Auth: `Authorization: Bearer <accessToken>`.  
Body: `{ "productId": "<course id>", "coupon": "OPTIONAL" }`.  
`productId` is the course id (`checkout.productId`, same id as `GET /courses`).

Success is **200** and the resource itself. The app reads `response.data`, not a `{ data: ... }` wrapper.

No coupon — this call opens checkout and must succeed for every published paid course:

```json
{
  "productId": "cmw3vzvuj0022v3902sx34gsy",
  "title": "GST Basics for Small Business",
  "mrpMinor": 100,
  "discountMinor": 0,
  "totalMinor": 100,
  "currency": "INR",
  "expiresAt": "2026-11-24T08:15:00.000Z",
  "methods": ["upi", "card", "netbanking", "wallet"]
}
```

Omit `coupon` and `couponDiscountMinor` when no code was sent.

Valid code — echo the code in uppercase and a real discount. `totalMinor` is the amount after the coupon. `0` means the course is free (§4).

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
  "expiresAt": "2026-11-24T08:15:00.000Z",
  "methods": ["upi", "card", "netbanking", "wallet"]
}
```

Rules:

1. Recompute from the published course price. Ignore any amount the phone sends.
2. Compare the code case-insensitively. Echo it in uppercase, exactly the code the learner sent.
3. `couponDiscountMinor` is an integer **greater than 0**. Zero, missing, or a rupee amount in this field is ignored by the app and the listed price stays.
4. `totalMinor` is an integer `>= 0`. `totalMinor + couponDiscountMinor` is the selling price before the coupon.
5. `methods` is a non-empty subset of `upi`, `card`, `netbanking`, `wallet`. An empty list hides the coupon box.
6. `expiresAt` is a future ISO-8601 time (15 minutes is enough). A past time disables Pay.
7. `currency` is `INR`.

Invalid, expired, wrong-course, disabled, or over-limit code — **400**, not 404 and not 500:

```json
{
  "code": "invalid_coupon",
  "message": "This coupon is not valid for this purchase.",
  "retryable": false
}
```

`message` is shown under the field (`expired`, `not valid for this course`, `usage limit reached`). The no-coupon quote for that course still returns 200.

### 2. `POST /api/payments/create-order`

The app sends this after a quote, including a partial discount:

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

`amount` is the quoted `totalMinor` in paise. `method` is `upi`, `card`, `netbanking`, or `wallet`.

Whitelist `amount`, `currency`, `courseId`, `coupon`, and `method`. A 400 whose message contains `should not exist` makes the current app **retry the order without the coupon** and open Razorpay at the unreduced price. Do not answer that way.

Server rules:

1. Load the course and recompute the coupon. The Razorpay order amount is that `totalMinor`, not `amount` from the body when they disagree. Reject the call when the body amount does not match the recomputed total.
2. Create the Razorpay order with the key secret. Auto-capture on.
3. Response must include a Razorpay order id (`id` or `orderId` starting with `order_`). Without that id the app stops with “Payment could not be started.”
4. The same `Idempotency-Key` returns the same order. It must not create a second Razorpay order.
5. Persist `courseId`, recomputed `amount`, `currency`, `coupon` (pending, not yet consumed), `method`, and `razorpay_order_id`.
6. Do not count a coupon use here. Count it only after §3 succeeds. A cancelled sheet must not burn a single-use code.

### 3. Store the fields, verify the signature, then verify the payment

After the sheet succeeds, the app posts only these fields (`courseId` is not on this body):

```http
POST /api/payments/verify-payment
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "orderId": "order_NxYz",
  "razorpay_order_id": "order_NxYz",
  "razorpay_payment_id": "pay_AbCd",
  "razorpay_signature": "<hex hmac>"
}
```

Do all of this on the server. The app does not have the key secret and does not call Razorpay.

**Store.** Save `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` on the order before trusting them.

**Signature.** HMAC SHA256 of `razorpay_order_id + "|" + razorpay_payment_id` using the Razorpay **key secret**. Compare in constant time. Mismatch → **400**, do not grant access:

```json
{
  "code": "invalid_signature",
  "message": "Payment could not be verified.",
  "retryable": false
}
```

**Payment status.** `GET https://api.razorpay.com/v1/payments/{razorpay_payment_id}` with the key id and key secret. Grant access only when every line is true:

| Check | Required |
|---|---|
| `status` | `captured` |
| `amount` | same paise as the stored order (the discounted total) |
| `currency` | `INR` |
| `order_id` | same as `razorpay_order_id` |

`authorized` is not enough. Capture it, or return `paidAccessPending` until it is `captured`. The app treats `authorized` as paid if you send that word, so do not send it until the money is captured.

Amount or order mismatch → **400**, no entitlement, no coupon use.

Then set the order to succeeded, grant course access, and increment coupon uses (total and per learner). The same `razorpay_payment_id` must return the same succeeded order and must not double-count the coupon.

Success is **200**:

```json
{
  "id": "order_NxYz",
  "courseId": "cmw3vzvuj0022v3902sx34gsy",
  "status": "succeeded",
  "amount": 50,
  "currency": "INR",
  "paidAt": "2026-11-24T08:20:00.000Z",
  "razorpay_payment_id": "pay_AbCd"
}
```

Status words the app maps:

| Server `status` | App result |
|---|---|
| `succeeded`, `paid`, `captured`, `success`, `verified` | Payment Success, then enroll |
| `paidAccessPending`, `pending` | Payment Pending. Do not charge again |
| `failed`, `failure` | Payment Failure |
| `cancelled`, `canceled` | Payment Failure, coupon not consumed |

A **200** with no `status` is treated as succeeded. Always send `status`.

### 4. Free coupon (`totalMinor` is 0)

Razorpay cannot charge ₹0. A 100% code (percent 100, or a fixed amount equal to the selling price) never opens Checkout.

On `POST /api/payments/create-order` with a recomputed total of **0** and a valid `coupon`:

- Do not call Razorpay.
- Create an internal order, status `succeeded`, amount `0`.
- Grant course access and count the coupon use in that same request.
- Return **200** with an id (an internal id is fine; it does not have to start with `order_`) and `"status": "succeeded"`.

A cancelled or failed attempt must not reach this branch. There is no Razorpay payment to verify.

The app still refuses to pay when `totalMinor <= 0` (`useCheckout`). Ship §4 with the app follow-up below, or Apply will show ₹0 and Pay will stop with “This purchase is unavailable.”

### 5. Coupon use

| Moment | Count a use? |
|---|---|
| Quote | No |
| Razorpay order created | No. Store the code as pending |
| Learner closes the sheet | No. Release the pending hold |
| Signature and `captured` check passed | Yes |
| Free claim order succeeded | Yes |

Enforce `startsAt` / `endsAt`, total uses, and per-learner uses at quote time and again at create-order time. A code that passed the quote and then hit its limit returns **400** `invalid_coupon` on create-order.

---

## Admin

Staff need a coupon on the paid course (GST Basics is the current ₹1 test course). They type rupees. The API stores paise.

| Field | Rule |
|---|---|
| Code | Unique, stored uppercase. Learner types any case |
| Type | Percent or fixed rupees |
| Amount | Percent 1–100. Fixed rupees `>= ₹1` and `<=` the course selling price. **100% or a fixed amount equal to the price is a free claim** (§4) |
| Course | This course id, or all paid courses. A code for another course is `invalid_coupon` |
| Window | `startsAt` / `endsAt`. Outside the window is `invalid_coupon` |
| Limits | Total uses and per-learner uses. Count a use only after §3 or §4 |
| Status | Active / disabled |

---

## App follow-up (not the server task)

Paid checkout and a partial discount need no further app work once §1–§3 are live. Two client changes are still open in this repo:

1. `createOrder` in `src/core/api/httpRepositories.ts` retries without `coupon` when the server says `should not exist`. Remove that retry so a rejected field fails Pay and leaves Razorpay closed. §2 must accept `coupon` so this path is never hit.
2. `useCheckout` throws when `totalMinor <= 0`. For a quote the server accepted with `totalMinor === 0` and `couponDiscountMinor > 0`, skip Razorpay and finish from the succeeded order in §4.

---

## Acceptance

- [ ] `POST /api/checkout/quote` with a bearer token and a published paid course id returns 200, `methods`, and a future `expiresAt`. No coupon fields.
- [ ] The same call with a valid partial code echoes `coupon` and a `couponDiscountMinor` greater than 0, and `totalMinor` is the reduced paise amount.
- [ ] A 100% code returns `totalMinor: 0` and `couponDiscountMinor` equal to the selling price.
- [ ] An unknown, expired, or wrong-course code returns **400** `invalid_coupon` and a readable `message`. The no-coupon quote for that course still returns 200.
- [ ] `POST /api/payments/create-order` accepts `coupon`, `method`, `currency`, and `courseId`. It does not answer `should not exist`.
- [ ] The Razorpay order amount is the recomputed `totalMinor`. The response id starts with `order_`.
- [ ] Repeating the same `Idempotency-Key` does not create a second Razorpay order.
- [ ] `POST /api/payments/verify-payment` stores the three Razorpay fields, rejects a bad HMAC with 400, and grants access only when Razorpay reports `captured` for that order and that paise amount.
- [ ] Verify returns `"status": "succeeded"` only after both checks. A second verify of the same payment does not count the coupon again.
- [ ] Closing the sheet does not consume the code. A free-claim create-order does, and it does not call Razorpay.
- [ ] Checkout on GST Basics shows the order summary and the coupon field. A good partial code opens Razorpay for the reduced amount.
