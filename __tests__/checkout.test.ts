import {
  catalogOffPercent,
  defaultMethod,
  formatQuoteCountdown,
  methodsFor,
} from '../src/features/payments/methods';
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
