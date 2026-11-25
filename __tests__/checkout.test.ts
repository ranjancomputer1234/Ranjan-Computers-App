import {
  catalogOffPercent,
  defaultMethod,
  formatQuoteCountdown,
  methodsFor,
} from '../src/features/payments/methods';
import {isFreeClaim, normalizeCheckoutQuote, quoteWithCoupon} from '../src/features/payments/couponQuote';
import {amountMismatch, checkoutAlert, paymentRecordStatus, verificationFailed} from '../src/features/payments/paymentOutcome';
import {cardLabel, validateCard, validateUpiId} from '../src/features/payments/paymentInstruments';
import {mergeSavedCard} from '../src/features/payments/savedCards';
import {methodLine} from '../src/features/payments/utils/receipt';

describe('checkout quote math', () => {
  it('calculates catalogue savings before a coupon', () => {
    expect(
      catalogOffPercent({
        mrpMinor: 99900,
        totalMinor: 44900,
        couponDiscountMinor: 5000,
      }),
    ).toBe(50);
  });
});

describe('checkout payment methods', () => {
  it('recommends UPI when it is available', () => {
    expect(defaultMethod(['card', 'upi', 'wallet'])).toBe('upi');
    expect(methodsFor(['wallet', 'card']).map(item => item.id)).toEqual([
      'card',
      'wallet',
    ]);
  });

  it('formats a selected bank', () => {
    expect(methodLine({method: 'netbanking', methodDetail: 'HDFC'})).toBe(
      'Net Banking · HDFC',
    );
  });
});

describe('checkout payment errors', () => {
  it('shows Payment failed instead of a raw entitlement code', () => {
    expect(
      checkoutAlert({
        code: 'entitlement_required',
        message: 'entitlement_required',
        retryable: false,
        httpStatus: 403,
      }),
    ).toEqual({
      title: 'Payment failed',
      message: 'Payment failed. This course was not enrolled.',
    });
  });

  it('keeps the learner signed in when checkout rejects the payment call', () => {
    expect(checkoutAlert({
      code: 'payment_unavailable',
      message: 'Payment could not be started. You are still signed in.',
      retryable: false,
      httpStatus: 401,
    })).toEqual({
      title: 'Could not start purchase',
      message: 'Payment could not be started. You are still signed in.',
    });
  });

  it('shows a Razorpay key failure instead of a sign-in message', () => {
    expect(checkoutAlert({
      code: 'RAZORPAY_AUTH_FAILED',
      message: 'Razorpay authentication failed. Check API keys.',
      retryable: false,
      httpStatus: 401,
    })).toEqual({
      title: 'Could not start purchase',
      message: 'Razorpay authentication failed. Check API keys.',
    });
  });

  it('keeps a quote problem readable', () => {
    expect(checkoutAlert(new Error('The quote expired. Please review the updated price.'))).toEqual({
      title: 'Could not start purchase',
      message: 'The quote expired. Please review the updated price.',
    });
  });
});

describe('payment details', () => {
  it('accepts a UPI ID and rejects a bare name', () => {
    expect(validateUpiId('learner@okaxis')).toBe(true);
    expect(validateUpiId('learner')).toBe(false);
  });

  it('checks a card without keeping the full number in the saved label', () => {
    expect(validateCard({number: '4242424242424242', name: 'Riya Sharma', expiry: '12/30', cvv: '123'}, new Date('2026-01-01'))).toBeNull();
    expect(cardLabel('4242424242424242')).toBe('Visa ···· 4242');
    expect(validateCard({number: '4242424242424241', name: 'Riya Sharma', expiry: '12/30', cvv: '123'}, new Date('2026-01-01'))).toBe('Enter a valid card number.');
  });

  it('stores a saved card by its masked id', () => {
    const card = {id: 'Visa-4242-12/30', brand: 'Visa', last4: '4242', expiry: '12/30', name: 'Riya Sharma'};
    expect(mergeSavedCard([card], card)).toEqual([card]);
  });
});

describe('server quote', () => {
  it('keeps a free coupon as a claim and rejects an invented total', () => {
    const quoted = normalizeCheckoutQuote({
      productId: 'course-1',
      title: 'GST Basics',
      mrpMinor: 100,
      discountMinor: 0,
      coupon: 'welcome50',
      couponDiscountMinor: 100,
      totalMinor: 0,
      currency: 'INR',
      expiresAt: '2026-11-24T08:15:00.000Z',
      methods: ['upi', 'card', 'netbanking', 'wallet'],
    }, 'course-1');
    expect(quoted.coupon).toBe('WELCOME50');
    expect(isFreeClaim(quoted)).toBe(true);
    expect(isFreeClaim({totalMinor: 0, couponDiscountMinor: 0})).toBe(false);
    expect(quoteWithCoupon(quoted, 'WELCOME50')?.totalMinor).toBe(0);
    expect(() => normalizeCheckoutQuote({totalMinor: Number.NaN}, 'course-1')).toThrow(/unavailable/);
  });

  it('reads payment status and does not treat a missing or authorized payment as success', () => {
    expect(paymentRecordStatus('succeeded')).toBe('succeeded');
    expect(paymentRecordStatus('paidAccessPending')).toBe('paidAccessPending');
    expect(paymentRecordStatus('authorized')).toBe('paidAccessPending');
    expect(paymentRecordStatus(undefined)).toBeUndefined();
    expect(verificationFailed({
      code: 'invalid_signature',
      message: 'Payment could not be verified.',
      retryable: false,
      httpStatus: 400,
    })).toBe(true);
    expect(amountMismatch({
      code: 'AMOUNT_MISMATCH',
      message: 'Refresh the quote.',
      retryable: false,
      httpStatus: 400,
    })).toBe(true);
    expect(verificationFailed({
      code: 'invalid_coupon',
      message: 'This coupon is not valid for this course.',
      retryable: false,
      httpStatus: 400,
    })).toBe(false);
  });
});

describe('quote countdown', () => {
  it('formats remaining time and expiry', () => {
    const now = Date.parse('2026-09-17T10:00:00+05:30');
    expect(
      formatQuoteCountdown('2026-09-17T10:14:05+05:30', now),
    ).toEqual({expired: false, label: '14:05'});
    expect(
      formatQuoteCountdown('2026-09-17T09:59:00+05:30', now)?.expired,
    ).toBe(true);
  });
});
