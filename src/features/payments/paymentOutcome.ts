import {isAppError} from '../../core/api/http';
import type {Order} from '../../core/types';

export const PAYMENT_FAILED_TITLE = 'Payment failed';
export const PAYMENT_FAILED_MESSAGE = 'Payment failed. This course was not enrolled.';

/** Server codes that mean the learner still has no paid access. */
export function accessBlocked(error: unknown): boolean {
  return /entitlement_required|purchase_required/i.test(errorText(error));
}

export function checkoutAlert(error: unknown): {title: string; message: string} {
  if (isAppError(error) && error.code === 'payment_unavailable') {
    return {title: 'Could not start purchase', message: error.message};
  }
  if (paymentFailed(error)) {
    return {title: PAYMENT_FAILED_TITLE, message: PAYMENT_FAILED_MESSAGE};
  }
  const message = readableMessage(error);
  return {title: 'Could not start purchase', message};
}

function paymentFailed(error: unknown): boolean {
  if (accessBlocked(error)) return true;
  if (isAppError(error)) {
    if (error.code === 'feature_unavailable') return true;
    if (error.httpStatus === 402 || error.httpStatus === 403 || error.httpStatus === 404 || error.httpStatus === 501) {
      return true;
    }
    return /^[a-z0-9_]+$/.test(error.message.trim());
  }
  if (error instanceof Error) {
    return error.message === 'Payment failed' || /not available yet/i.test(error.message) || /^[a-z0-9_]+$/.test(error.message.trim());
  }
  return false;
}

function readableMessage(error: unknown): string {
  if (isAppError(error) && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Please try again.';
}

const VERIFY_FAILURES = new Set(['INVALID_SIGNATURE', 'PAYMENT_MISMATCH', 'PAYMENT_NOT_CAPTURED', 'VALIDATION_ERROR']);

/**
 * Map a payment resource status.
 * `authorized` is not captured, so it stays pending.
 * A missing status is not success.
 */
export function paymentRecordStatus(value: unknown): Order['status'] | undefined {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!status) return undefined;
  if (status === 'paidaccesspending' || status === 'pending' || status === 'authorized') return 'paidAccessPending';
  if (status === 'failed' || status === 'failure') return 'failed';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status === 'succeeded' || status === 'paid' || status === 'captured' || status === 'success' || status === 'verified') {
    return 'succeeded';
  }
  return undefined;
}

/** A 400 from verify-payment is a failed payment, not a charge to retry. */
export function verificationFailed(error: unknown): boolean {
  if (!isAppError(error) || error.httpStatus !== 400) return false;
  return VERIFY_FAILURES.has(error.code.toUpperCase());
}

export function amountMismatch(error: unknown): boolean {
  return isAppError(error) && error.code.toUpperCase() === 'AMOUNT_MISMATCH';
}

function errorText(error: unknown): string {
  if (isAppError(error)) return `${error.code} ${error.message}`;
  if (error instanceof Error) return error.message;
  return '';
}
