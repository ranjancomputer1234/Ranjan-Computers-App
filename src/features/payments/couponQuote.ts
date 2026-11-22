import {isAppError, isFeatureUnavailable} from '../../core/api/http';
import type {Order} from '../../core/types';

export type CheckoutQuote = Order['quote'] & {productId: string; title: string};

/** Accept a coupon only when the server repeats the code and a real discount. */
export function quoteWithCoupon(quoted: CheckoutQuote, code: string, fallback?: CheckoutQuote): CheckoutQuote | null {
  const echoed = quoted.coupon?.trim().toUpperCase();
  const requested = code.trim().toUpperCase();
  if (!echoed || echoed !== requested) return null;
  const discount = quoted.couponDiscountMinor ?? 0;
  if (!Number.isFinite(discount) || discount <= 0) return null;
  if (!Number.isFinite(quoted.totalMinor) || quoted.totalMinor < 0) return null;
  return {
    ...(fallback ?? quoted),
    ...quoted,
    productId: quoted.productId || fallback?.productId || '',
    title: quoted.title?.trim() || fallback?.title || 'Enrollment',
    currency: quoted.currency || fallback?.currency || 'INR',
    methods: quoted.methods?.length ? quoted.methods : (fallback?.methods ?? []),
    mrpMinor: Number.isFinite(quoted.mrpMinor) ? quoted.mrpMinor : (fallback?.mrpMinor ?? Math.round(quoted.totalMinor + discount)),
    discountMinor: Number.isFinite(quoted.discountMinor) ? quoted.discountMinor : (fallback?.discountMinor ?? 0),
    coupon: echoed,
    couponDiscountMinor: Math.round(discount),
    totalMinor: Math.round(quoted.totalMinor),
    expiresAt: quoted.expiresAt || fallback?.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/** A failed coupon request must stay on the coupon field. It is not a broken order. */
export function couponFailureMessage(error: unknown): string {
  const unchanged = 'This coupon could not be applied. The listed price is unchanged.';
  if (!isAppError(error)) return unchanged;
  const message = error.message?.trim() ?? '';
  const routeMissing =
    isFeatureUnavailable(error) ||
    error.httpStatus === 405 ||
    error.httpStatus === 501 ||
    /should not exist/i.test(message) ||
    (error.httpStatus === 404 &&
      (error.code === 'ERR_BAD_REQUEST' || error.code === 'network_error' || /cannot post/i.test(message)));
  if (routeMissing) {
    return 'Coupon codes are not available for this purchase yet. The listed price is unchanged.';
  }
  if (error.code === 'invalid_coupon' || error.httpStatus === 400 || error.httpStatus === 404 || error.httpStatus === 422) {
    if (message && !/^request failed\.?$/i.test(message)) return message;
    return 'This coupon is not valid for this purchase.';
  }
  if (error.retryable) return 'This coupon could not be applied. Check your connection and try again.';
  return message || unchanged;
}
