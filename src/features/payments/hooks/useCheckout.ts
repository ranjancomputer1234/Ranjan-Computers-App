import {useEffect, useMemo, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {clearPurchase, clearUnplacedPurchase, readPurchase, terminalOrder, writePurchase} from '../purchaseState';
import {enrollmentQuote} from '../enrollmentQuote';
import {accountKey, isAuthenticated} from '../../../core/session';
import {paymentService} from '../../../core/services';
import {appConfig} from '../../../core/config';
import {currentSessionGeneration, isAppError, isFeatureUnavailable} from '../../../core/api/http';
import {queryClient, queryKeys} from '../../../core/query';
import {getAccountScoped, setAccountScoped} from '../../../core/storage';
import {inr} from '../utils/inr';
import {defaultMethod, formatQuoteCountdown, methodsFor} from '../methods';
import {couponFailureMessage, quoteWithCoupon, type CheckoutQuote} from '../couponQuote';
import {accessBlocked, checkoutAlert, PAYMENT_FAILED_MESSAGE, PAYMENT_FAILED_TITLE} from '../paymentOutcome';
import type {SavedCard} from '../paymentInstruments';
import {readSavedCards, storeSavedCard} from '../savedCards';
import type {LearnerProfile, Order, PaymentMethodId} from '../../../core/types';
import type {CheckoutParams, RootNav} from '../../../navigation/types';

type PayOutcome = Order | {failed: true};
type PayInput = {methodDetail?: string; saveCard?: SavedCard};

function commerceMissing(error: unknown) {
  return isFeatureUnavailable(error) || (isAppError(error) && (error.httpStatus === 404 || error.httpStatus === 405 || error.httpStatus === 501));
}

function razorpayContact(phone?: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.length >= 8 ? digits : undefined;
}

const METHOD_PREF = 'preferredPaymentMethod';

export function useCheckout() {
  const navigation = useNavigation<RootNav>();
  const checkout = useRoute().params as CheckoutParams;
  const productId = checkout.productId;
  const preview = useMemo(
    () => enrollmentQuote({
      productId: checkout.productId,
      title: checkout.title,
      amountMinor: checkout.amountMinor,
      currency: checkout.currency,
    }),
    [checkout.productId, checkout.title, checkout.amountMinor, checkout.currency],
  );
  const repos = useRepositories();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, applyCoupon] = useState('');
  const [couponQuote, setCouponQuote] = useState<CheckoutQuote | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [method, setMethodState] = useState<PaymentMethodId | undefined>();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const running = useRef(false);
  const owner = accountKey();

  const quote = useQuery({
    queryKey: queryKeys.quote(owner, productId, ''),
    queryFn: async () => {
      try {
        return await repos.commerce.quote(productId);
      } catch (error) {
        if (!commerceMissing(error)) throw error;
        return enrollmentQuote(checkout);
      }
    },
    enabled: isAuthenticated(),
    staleTime: 0,
    placeholderData: preview,
  });
  const storeProduct = useQuery({
    queryKey: ['store-product', quote.data?.storeProductId],
    queryFn: () => paymentService.product(quote.data!.storeProductId!),
    enabled: Boolean(quote.data?.storeProductId),
    staleTime: 0,
  });

  const data = couponQuote ?? quote.data;
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
    void readSavedCards(owner).then(setSavedCards);
  }, [owner]);

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
    if (couponQuote) {
      setCouponQuote(null);
      applyCoupon('');
      setCouponError('That price expired. Apply the coupon again before you pay.');
    }
    void refetchQuote();
  }, [expired, couponQuote, refetchQuote]);

  const setMethod = (next: PaymentMethodId) => {
    setMethodState(next);
    void setAccountScoped(owner, METHOD_PREF, next);
  };

  const submitCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code || couponBusy) return;
    setCouponError('');
    setCouponBusy(true);
    try {
      const quoted = await repos.commerce.quote(productId, code);
      const accepted = quoteWithCoupon(quoted, code, quote.data ?? preview);
      if (!accepted) {
        setCouponError('This coupon could not be applied. The listed price is unchanged.');
        return;
      }
      setCouponQuote(accepted);
      applyCoupon(accepted.coupon ?? code);
    } catch (error) {
      setCouponError(couponFailureMessage(error));
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCoupon('');
    setCouponError('');
    setCouponQuote(null);
    applyCoupon('');
  };

  const payableLabel = storeProduct.data?.formattedPrice ?? (data && data.totalMinor > 0 ? inr(data.totalMinor, data.currency) : '');
  const unavailable = !inAppCheckout && !storeProduct.data;

  const finishPaidOrder = async (order: Order): Promise<Order> => {
    if (order.status !== 'succeeded') return order;
    if (checkout.contentKind !== 'course' || !checkout.contentId) return order;
    try {
      await repos.learning.enroll(checkout.contentId);
    } catch (error) {
      const alreadyEnrolled = isAppError(error) && (error.httpStatus === 409 || /already/i.test(`${error.code} ${error.message}`));
      if (alreadyEnrolled) return order;
      if (accessBlocked(error) || (isAppError(error) && error.httpStatus === 403)) {
        return {...order, status: 'paidAccessPending'};
      }
    }
    return order;
  };

  const pay = useMutation<PayOutcome, Error, PayInput | void>({
    mutationFn: async (input): Promise<PayOutcome> => {
      const methodDetail = input?.methodDetail?.trim() || undefined;
      if (running.current) throw new Error('A purchase is already in progress.');
      if (!isAuthenticated() || !data) throw new Error('This purchase is unavailable.');
      if (!Number.isFinite(Date.parse(data.expiresAt)) || Date.parse(data.expiresAt) <= Date.now()) {
        void quote.refetch();
        throw new Error('The quote expired. Please review the updated price.');
      }
      const playBilling = Boolean(storeProduct.data) && !inAppCheckout;
      if (playBilling && !appConfig.capabilities.payments) throw new Error('This purchase is unavailable.');
      if (playBilling && !storeProduct.data) throw new Error('This product is not available on Google Play yet.');
      if (!playBilling && !inAppCheckout) throw new Error('Choose a payment method to continue.');
      if (inAppCheckout && !selectedMethod) throw new Error('Choose a payment method to continue.');
      if (!playBilling && data.totalMinor <= 0) throw new Error('This purchase is unavailable.');
      running.current = true;
      const generation = currentSessionGeneration();
      const courseId = checkout.contentKind === 'course' && checkout.contentId ? checkout.contentId : productId;
      try {
        const prior = await readPurchase(owner);
        if (prior?.orderId) {
          try {
            const existing = await repos.commerce.getOrder(prior.orderId);
            if (!terminalOrder(existing.status) || existing.status === 'succeeded') return finishPaidOrder(existing);
            await clearPurchase(owner, existing.id);
          } catch (error) {
            if (!commerceMissing(error)) throw error;
            await clearPurchase(owner, prior.orderId);
          }
        }
        if (prior && !prior.orderId && prior.productId !== productId) throw new Error('Retry your earlier checkout first so its order can be recovered.');
        const key = prior && !prior.orderId ? prior.key : 'order-' + productId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        await writePurchase(owner, {productId, key});
        const couponToSend = inAppCheckout ? appliedCoupon || undefined : undefined;
        let order: Order;
        let razorpayKey: string | undefined;
        try {
          if (!playBilling) {
            const config = await repos.commerce.paymentConfig();
            if (!config.configured || !config.keyId) throw new Error('This purchase is not available yet.');
            razorpayKey = config.keyId;
          }
          order = await repos.commerce.createOrder(productId, couponToSend, key, selectedMethod, {
            amountMinor: data.totalMinor,
            currency: data.currency,
            courseId,
          });
        } catch (error) {
          await clearUnplacedPurchase(owner);
          if (commerceMissing(error) || accessBlocked(error)) return {failed: true};
          throw error;
        }
        if (generation !== currentSessionGeneration()) throw new Error('Your account changed. Please reopen checkout.');
        await writePurchase(owner, {productId, key, orderId: order.id});
        if (!['idle', 'creatingOrder', 'awaitingProvider'].includes(order.status)) {
          return finishPaidOrder(order);
        }
        const profile =
          queryClient.getQueryData<LearnerProfile>(queryKeys.profile(owner)) ??
          (await repos.auth.me().catch(() => undefined));
        let launch;
        try {
          launch = await paymentService.launch(
            order.id,
            order.quote.totalMinor > 0 ? order.quote.totalMinor : data.totalMinor,
            storeProduct.data,
            owner,
            razorpayKey
              ? {
                  keyId: razorpayKey,
                  orderId: order.id,
                  currency: order.quote.currency || data.currency || 'INR',
                  description: data.title,
                  method: selectedMethod,
                  prefill: {
                    name: profile?.fullName,
                    email: profile?.email,
                    contact: razorpayContact(profile?.phone),
                  },
                }
              : undefined,
          );
        } catch (error) {
          await clearPurchase(owner, order.id);
          if (error instanceof Error && /rebuild/i.test(error.message)) throw error;
          return {failed: true};
        }
        if (generation !== currentSessionGeneration()) throw new Error('Your account changed. Restore purchases from your original account.');
        if (launch.status === 'cancelled' || launch.status === 'failed') {
          await clearPurchase(owner, order.id);
          return {failed: true};
        }
        if (!launch.payload?.razorpay_payment_id || !launch.payload.razorpay_signature) {
          const pending = {...order, title: data.title, quote: data, status: 'unknownNeedsRecheck' as const};
          repos.commerce.noteOrder(pending);
          return pending;
        }
        let verified: Order;
        try {
          verified = await repos.commerce.verify(order.id, {
            orderId: launch.payload.razorpay_order_id || order.id,
            razorpay_order_id: launch.payload.razorpay_order_id || order.id,
            razorpay_payment_id: launch.payload.razorpay_payment_id,
            razorpay_signature: launch.payload.razorpay_signature,
            courseId,
          });
        } catch (error) {
          const pending = {...order, title: data.title, quote: data, status: 'unknownNeedsRecheck' as const};
          repos.commerce.noteOrder(pending);
          throw error;
        }
        const receipt: Order = {
          ...verified,
          id: verified.id || order.id,
          productId,
          title: quote.data.title,
          quote: quote.data,
          method: selectedMethod ?? verified.method,
          methodDetail: methodDetail ?? verified.methodDetail,
          paidAt: verified.paidAt ?? (verified.status === 'succeeded' ? new Date().toISOString() : undefined),
        };
        const finished = await finishPaidOrder(receipt);
        repos.commerce.noteOrder(finished);
        if (finished.id !== order.id) repos.commerce.noteOrder({...finished, id: order.id});
        return finished;
      } finally {
        running.current = false;
      }
    },
    onSuccess: async (outcome, input) => {
      if (accountKey() !== owner || !isAuthenticated()) return;
      if ('failed' in outcome) {
        Alert.alert(PAYMENT_FAILED_TITLE, PAYMENT_FAILED_MESSAGE);
        return;
      }
      const order = outcome;
      if (terminalOrder(order.status)) await clearPurchase(owner, order.id);
      if (order.status === 'succeeded') {
        if (input?.saveCard) setSavedCards(await storeSavedCard(owner, input.saveCard));
        await queryClient.invalidateQueries({
          predicate: query => {
            const root = String(query.queryKey[0]);
            return root === 'course' || root === 'learner' || root === 'lessons' || root === 'catalog' || root === 'home';
          },
        });
        navigation.replace('PaymentSuccess', {orderId: order.id});
      } else if (order.status === 'failed' || order.status === 'cancelled') {
        navigation.replace('PaymentFailure', {orderId: order.id});
      } else navigation.replace('PaymentPending', {orderId: order.id});
    },
    onError: async error => {
      if (accountKey() !== owner || !isAuthenticated()) return;
      const pending = await readPurchase(owner).catch(() => null);
      const alert = checkoutAlert(error);
      if (pending?.orderId && !accessBlocked(error)) {
        navigation.replace('PaymentPending', {orderId: pending.orderId});
        return;
      }
      if (pending?.orderId) await clearPurchase(owner, pending.orderId).catch(() => {});
      Alert.alert(alert.title, alert.message);
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
    availableMethods,
    inAppCheckout,
    quote,
    storeProduct,
    savedCards,
    pay,
    data,
    payableLabel,
    unavailable,
    countdown,
    expired,
  };
}
