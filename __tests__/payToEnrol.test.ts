import {checkoutTargetFor, payToEnrolCue, payToEnrolMessage} from '../src/features/catalog/payToEnrol';
import {enrollmentQuote} from '../src/features/payments/enrollmentQuote';

describe('pay to enroll', () => {
  it('keeps the amount in the message and a short cue under the price', () => {
    const price = {amountMinor: 49900, currency: 'INR'};
    expect(payToEnrolCue(price)).toBe('One-time payment');
    expect(payToEnrolMessage({title: 'GST Basics', price})).toContain('Pay ₹499 to Enroll in GST Basics.');
  });

  it('still asks to Enroll when no amount was published', () => {
    expect(payToEnrolCue()).toBe('Pay to Enroll');
    expect(payToEnrolMessage({title: 'Daily news'})).toContain('Pay to Enroll in Daily news.');
  });

  it('opens checkout with the published product and price', () => {
    const target = checkoutTargetFor({
      kind: 'course',
      id: 'course-1',
      title: 'GST Basics',
      price: {amountMinor: 49900, currency: 'INR'},
      productId: 'product-gst',
    });
    expect(target).toMatchObject({
      productId: 'product-gst',
      title: 'GST Basics',
      amountMinor: 49900,
      currency: 'INR',
      contentKind: 'course',
      contentId: 'course-1',
    });
    expect(enrollmentQuote(target, Date.parse('2026-09-17T10:00:00+05:30'))).toMatchObject({
      productId: 'product-gst',
      title: 'GST Basics',
      totalMinor: 49900,
      currency: 'INR',
      methods: ['upi', 'card', 'netbanking', 'wallet'],
    });
  });
});
