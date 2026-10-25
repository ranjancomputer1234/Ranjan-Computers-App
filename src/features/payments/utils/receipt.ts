import type {Order, PaymentMethodId} from '../../../core/types';
import {inr} from './inr';

const METHOD_LABEL: Record<PaymentMethodId, string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
};

export function methodLabel(method?: PaymentMethodId) {
  if (!method) return 'Google Play';
  return METHOD_LABEL[method] ?? method;
}

export function methodLine(order: Pick<Order, 'method' | 'methodDetail'>) {
  const label = methodLabel(order.method);
  return order.methodDetail ? `${label} · ${order.methodDetail}` : label;
}

export function formatPaidAt(iso?: string) {
  if (!iso || !Number.isFinite(Date.parse(iso))) return 'Just now';
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
  const time = date.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: false});
  return `${day} · ${time}`;
}

export function unlockCopy(order: Order) {
  const title = order.title.toLowerCase();
  if (title.includes('mock') || order.productId.includes('test')) {
    return 'Mock tests unlocked instantly — start practicing now';
  }
  if (title.includes('course') || order.productId.includes('course')) {
    return 'Course access unlocked — find it in My Learning';
  }
  return 'Purchase unlocked instantly — access is ready in My Learning';
}

export function primaryCta(order: Order) {
  const title = order.title.toLowerCase();
  if (title.includes('mock') || order.productId.includes('test')) {
    return {label: 'Start Mock Test Now', kind: 'tests' as const};
  }
  return {label: 'Open My Learning', kind: 'learning' as const};
}

export function receiptMessage(order: Order) {
  const amount = inr(order.quote.totalMinor, order.quote.currency);
  const lines = [
    'RACI Payment Receipt',
    '',
    `Item: ${order.title}`,
    `Amount: ${amount}`,
    `Method: ${methodLine(order)}`,
    `Date: ${formatPaidAt(order.paidAt)}`,
    `Txn ID: ${order.id}`,
    order.receiptId ? `Ref No.: ${order.receiptId}` : null,
    '',
    'Thank you for learning with RACI.',
  ];
  return lines.filter(Boolean).join('\n');
}

export function failureReason(status: Order['status']) {
  if (status === 'cancelled') return 'You cancelled before the payment finished.';
  if (status === 'failed') return 'The payment provider could not complete this charge.';
  return 'This purchase could not be confirmed.';
}
