import type {Order, PaymentMethodId} from '../../core/types';
import type {CheckoutParams} from '../../navigation/types';

const CHECKOUT_METHODS: PaymentMethodId[] = ['upi', 'card', 'netbanking', 'wallet'];

/** Price shown on checkout when the payment service has no quote yet. */
export function enrollmentQuote(
  target: Pick<CheckoutParams, 'productId' | 'title' | 'amountMinor' | 'currency'>,
  now = Date.now(),
): Order['quote'] & {productId: string; title: string} {
  const amount =
    typeof target.amountMinor === 'number' && Number.isFinite(target.amountMinor) && target.amountMinor > 0
      ? Math.round(target.amountMinor)
      : 0;
  return {
    productId: target.productId,
    title: target.title?.trim() || 'Enrollment',
    mrpMinor: amount,
    discountMinor: 0,
    totalMinor: amount,
    currency: target.currency?.trim() || 'INR',
    expiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
    methods: [...CHECKOUT_METHODS],
  };
}
