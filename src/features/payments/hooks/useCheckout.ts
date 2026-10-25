import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {keepPreviousData, useMutation, useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {clearPurchase, readPurchase, terminalOrder, writePurchase} from '../purchaseState';
import {accountKey, isAuthenticated} from '../../../core/session';
import {paymentService} from '../../../core/services';
import {appConfig} from '../../../core/config';
import {currentSessionGeneration} from '../../../core/api/http';
import {queryKeys} from '../../../core/query';
import {getAccountScoped, setAccountScoped} from '../../../core/storage';
import {inr} from '../utils/inr';
import {defaultMethod, formatQuoteCountdown, methodsFor} from '../methods';
import type {PaymentMethodId} from '../../../core/types';
import type {RootNav} from '../../../navigation/types';

const METHOD_PREF = 'preferredPaymentMethod';

export function useCheckout() {
  const navigation = useNavigation<RootNav>();
  const productId = (useRoute().params as {productId: string}).productId;
  const repos = useRepositories();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, applyCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [method, setMethodState] = useState<PaymentMethodId | undefined>();
  const [instrument, setInstrument] = useState<string | undefined>();
  const [expanded, setExpanded] = useState<PaymentMethodId | undefined>();
  const [now, setNow] = useState(() => Date.now());
  const running = useRef(false);
  const owner = accountKey();

  const quote = useQuery({
    queryKey: queryKeys.quote(owner, productId, appliedCoupon),
    queryFn: () => repos.commerce.quote(productId, appliedCoupon || undefined),
    enabled: isAuthenticated(),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
  const storeProduct = useQuery({
    queryKey: ['store-product', quote.data?.storeProductId],
    queryFn: () => paymentService.product(quote.data!.storeProductId!),
    enabled: Boolean(quote.data?.storeProductId),
    staleTime: 0,
  });

  const data = quote.data;
  const availableMethods = methodsFor(data?.methods);
  const inAppCheckout = availableMethods.length > 0;
  const selectedMethod = inAppCheckout
    ? availableMethods.some(item => item.id === method)
      ? method
      : defaultMethod(data?.methods)
    : undefined;

  useEffect(() => {
    if (!isAuthenticated()) return;
    void getAccountScoped<PaymentMethodId | ''>(owner, METHOD_PREF, '').then(saved => {
      if (saved) setMethodState(saved);
    });
  }, [owner]);

  useEffect(() => {
    if (quote.isError && appliedCoupon) {
      const err = quote.error as {code?: string; message?: string};
      if (err?.code === 'invalid_coupon') {
        setCouponError(err.message || 'This coupon is not valid for this purchase.');
        applyCoupon('');
      }
    }
  }, [quote.isError, quote.error, appliedCoupon]);

  useEffect(() => {
    const expiresAt = data?.expiresAt;
    if (!expiresAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.expiresAt]);

  const countdown = formatQuoteCountdown(data?.expiresAt, now);
  const expired = Boolean(countdown?.expired);
  const refetchQuote = quote.refetch;
  useEffect(() => {
    if (!expired) return;
    void refetchQuote();
  }, [expired, refetchQuote]);

  const setMethod = (next: PaymentMethodId) => {
    setMethodState(next);
    setInstrument(undefined);
    void setAccountScoped(owner, METHOD_PREF, next);
  };

  const submitCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    applyCoupon(code);
  };

  const removeCoupon = () => {
    setCoupon('');
    setCouponError('');
    applyCoupon('');
  };

  const payableLabel = storeProduct.data?.formattedPrice ?? (data ? inr(data.totalMinor, data.currency) : '');
  const unavailable = !storeProduct.data;

  const pay = useMutation({
    mutationFn: async () => {
      if (running.current) throw new Error('A purchase is already in progress.');
      if (!isAuthenticated() || !quote.data || !appConfig.capabilities.payments) throw new Error('This purchase is unavailable.');
      if (!Number.isFinite(Date.parse(quote.data.expiresAt)) || Date.parse(quote.data.expiresAt) <= Date.now()) {
        void quote.refetch();
        throw new Error('The quote expired. Please review the updated price.');
      }
      if (!storeProduct.data) throw new Error('This product is not available on Google Play yet.');
      if (inAppCheckout && !selectedMethod) throw new Error('Choose a payment method to continue.');
      running.current = true;
      const generation = currentSessionGeneration();
      try {
        const prior = await readPurchase(owner);
        if (prior?.orderId) {
          const existing = await repos.commerce.getOrder(prior.orderId);
          if (!terminalOrder(existing.status) || existing.status === 'succeeded') return existing;
          await clearPurchase(owner, existing.id);
        }
        if (prior && !prior.orderId && prior.productId !== productId) throw new Error('Retry your earlier checkout first so its order can be recovered.');
        const key = prior && !prior.orderId ? prior.key : 'order-' + productId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        await writePurchase(owner, {productId, key});
        const couponToSend = inAppCheckout ? appliedCoupon || undefined : undefined;
        const order = await repos.commerce.createOrder(productId, couponToSend, key, selectedMethod);
        if (generation !== currentSessionGeneration()) throw new Error('Your account changed. Please reopen checkout.');
        await writePurchase(owner, {productId, key, orderId: order.id});
        if (!['idle', 'creatingOrder', 'awaitingProvider'].includes(order.status)) return order;
        const launch = await paymentService.launch(order.id, order.quote.totalMinor, storeProduct.data, owner);
        if (generation !== currentSessionGeneration()) throw new Error('Your account changed. Restore purchases from your original account.');
        if (launch.status === 'cancelled') {
          return {...order, status: 'cancelled' as const};
        }
        if (launch.status === 'failed') {
          return {...order, status: 'failed' as const};
        }
        if (!launch.payload) return {...order, status: 'unknownNeedsRecheck' as const};
        return await repos.commerce.verify(order.id, {
          ...launch.payload,
          method: selectedMethod,
          methodDetail: instrument,
        });
      } finally {
        running.current = false;
      }
    },
    onSuccess: async order => {
      if (accountKey() !== owner || !isAuthenticated()) return;
      if (terminalOrder(order.status)) await clearPurchase(owner, order.id);
      if (order.status === 'succeeded') navigation.replace('PaymentSuccess', {orderId: order.id});
      else if (order.status === 'failed') navigation.replace('PaymentFailure', {orderId: order.id});
      else if (order.status === 'cancelled') Alert.alert('Purchase cancelled', 'You can return to checkout whenever you are ready.');
      else navigation.replace('PaymentPending', {orderId: order.id});
    },
    onError: async error => {
      if (accountKey() !== owner || !isAuthenticated()) return;
      const pending = await readPurchase(owner).catch(() => null);
      if (pending?.orderId) navigation.replace('PaymentPending', {orderId: pending.orderId});
      else Alert.alert('Could not start purchase', (error as Error).message || 'Please try again.');
    },
  });

  return {
    navigation,
    coupon,
    setCoupon,
    appliedCoupon,
    couponError,
    submitCoupon,
    removeCoupon,
    method: selectedMethod,
    setMethod,
    instrument,
    setInstrument,
    expanded,
    setExpanded,
    availableMethods,
    inAppCheckout,
    quote,
    storeProduct,
    pay,
    data,
    payableLabel,
    unavailable,
    countdown,
    expired,
  };
}
