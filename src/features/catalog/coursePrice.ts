import type {Money} from '../../core/types';
import {inr} from '../payments/utils/inr';

type PricedCourse = {
  pricing: 'free' | 'paid';
  price?: Money;
  purchased?: boolean;
  enrolled?: boolean;
};

/** Badge text: ENROLLED, FREE, ₹499, PURCHASED, or PAID when the API omitted an amount. */
export function coursePriceLabel(item: PricedCourse): string {
  if (item.enrolled) return 'ENROLLED';
  if (item.purchased) return 'PURCHASED';
  if (item.pricing === 'free') return 'FREE';
  if (!item.price || item.price.amountMinor <= 0) return 'PAID';
  return inr(item.price.amountMinor, item.price.currency || 'INR');
}

/** Footer headline on the course page. */
export function coursePriceHeadline(item: PricedCourse): string {
  if (item.enrolled) return 'Enrolled';
  if (item.purchased) return 'Purchased';
  if (item.pricing === 'free') return 'Free Course';
  if (!item.price || item.price.amountMinor <= 0) return 'Paid Course';
  return inr(item.price.amountMinor, item.price.currency || 'INR');
}
