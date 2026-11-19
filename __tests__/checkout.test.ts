import {
  catalogOffPercent,
  defaultMethod,
  formatQuoteCountdown,
  methodsFor,
} from '../src/features/payments/methods';
import {checkoutAlert} from '../src/features/payments/paymentOutcome';
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
