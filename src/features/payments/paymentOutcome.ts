import {isAppError} from '../../core/api/http';

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

function errorText(error: unknown): string {
  if (isAppError(error)) return `${error.code} ${error.message}`;
  if (error instanceof Error) return error.message;
  return '';
}
