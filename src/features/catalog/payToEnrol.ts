import {Alert} from 'react-native';
import {isAuthenticated, useSessionStore} from '../../core/session';
import type {ContentKind, EntityId, Money} from '../../core/types';
import {navigationRef} from '../../navigation/navigationRef';
import type {CheckoutParams} from '../../navigation/types';
import {coursePriceLabel} from './coursePrice';

type PayTarget = {
  kind: ContentKind;
  id: EntityId;
  title?: string;
  price?: Money;
  productId?: EntityId;
};

export function payToEnrolAmount(price?: Money): string | undefined {
  if (!price) return undefined;
  const label = coursePriceLabel({pricing: 'paid', price});
  return label === 'PAID' ? undefined : label;
}

/** Line under the price. The amount is already the headline, so this stays a short label. */
export function payToEnrolCue(price?: Money): string {
  return payToEnrolAmount(price) ? 'One-time payment' : 'Pay to Enroll';
}

export function payToEnrolMessage(input: {title?: string; price?: Money}): string {
  const amount = payToEnrolAmount(input.price);
  const title = input.title?.trim();
  const lead = title && amount
    ? `Pay ${amount} to Enroll in ${title}.`
    : amount
      ? `Pay ${amount} to Enroll.`
      : title
        ? `Pay to Enroll in ${title}.`
        : 'Pay to Enroll to unlock this.';
  return `${lead} Checkout opens so you can complete the payment.`;
}

export function checkoutTargetFor(target: PayTarget): CheckoutParams {
  const amount = target.price?.amountMinor;
  return {
    productId: target.productId?.trim() || target.id,
    title: target.title?.trim() || undefined,
    amountMinor: typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? Math.round(amount) : undefined,
    currency: target.price?.currency,
    contentKind: target.kind,
    contentId: target.id,
  };
}

/** Sign-in gate, then the checkout screen. Access is granted only after payment. */
export function promptPayToEnrol(target: PayTarget) {
  if (!isAuthenticated()) {
    useSessionStore.getState().setPendingDestination({kind: target.kind, id: target.id});
    useSessionStore.getState().showLogin();
    return;
  }
  const checkout = checkoutTargetFor(target);
  if (navigationRef.isReady()) {
    navigationRef.navigate('Checkout', checkout);
    return;
  }
  Alert.alert('Pay to Enroll', payToEnrolMessage(target));
}
