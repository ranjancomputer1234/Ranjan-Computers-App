import type {ClayVariant} from '../../theme';
import type {IconName} from '../../assets/icons';
import type {PaymentMethodId} from '../../core/types';

export type PaymentMethodView = {
  id: PaymentMethodId;
  label: string;
  hint: string;
  icon: IconName;
  clay: ClayVariant;
  iconColor: string;
  recommended?: boolean;
  accessory: 'recommended' | 'add' | 'chevron';
  options?: string[];
};

export const PAYMENT_METHODS: PaymentMethodView[] = [
  {
    id: 'upi',
    label: 'UPI',
    hint: 'GPay · PhonePe · Paytm',
    icon: 'zap',
    clay: 'blue',
    iconColor: '#1565C0',
    recommended: true,
    accessory: 'recommended',
    options: ['GPay', 'PhonePe', 'Paytm'],
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    hint: 'Visa · Mastercard · RuPay',
    icon: 'card',
    clay: 'purple',
    iconColor: '#7B1FA2',
    accessory: 'add',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    hint: 'All major banks',
    icon: 'bank',
    clay: 'mint',
    iconColor: '#00796B',
    accessory: 'chevron',
    options: ['SBI', 'HDFC', 'ICICI', 'Axis', 'Other'],
  },
  {
    id: 'wallet',
    label: 'Wallets',
    hint: 'Paytm · Amazon Pay',
    icon: 'rupee',
    clay: 'orange',
    iconColor: '#EF6C00',
    accessory: 'chevron',
    options: ['Paytm', 'Amazon Pay'],
  },
];

export function methodsFor(ids?: PaymentMethodId[]) {
  if (!ids?.length) return [];
  const allowed = new Set(ids);
  return PAYMENT_METHODS.filter(item => allowed.has(item.id));
}

export function defaultMethod(ids?: PaymentMethodId[]): PaymentMethodId | undefined {
  const available = methodsFor(ids);
  return available.find(item => item.recommended)?.id ?? available[0]?.id;
}

export function catalogOffPercent(quote: {
  mrpMinor: number;
  totalMinor: number;
  couponDiscountMinor?: number;
}) {
  const beforeCoupon = quote.totalMinor + (quote.couponDiscountMinor ?? 0);
  if (!Number.isFinite(quote.mrpMinor) || quote.mrpMinor <= 0 || quote.mrpMinor <= beforeCoupon) {
    return 0;
  }
  return Math.round(((quote.mrpMinor - beforeCoupon) / quote.mrpMinor) * 100);
}

export function formatQuoteCountdown(expiresAt?: string, now = Date.now()) {
  if (!expiresAt || !Number.isFinite(Date.parse(expiresAt))) return null;
  const remaining = Date.parse(expiresAt) - now;
  if (remaining <= 0) return {expired: true as const, label: '0:00'};
  const total = Math.floor(remaining / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return {expired: false as const, label: `${minutes}:${String(seconds).padStart(2, '0')}`};
}
