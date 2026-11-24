import {Alert, Share, Linking, NativeModules} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import NetInfo from '@react-native-community/netinfo';
import {ensureCourseStorage} from '../features/permissions/courseStorage';
import {appConfig} from './config';
import {getPreference} from './storage';

export type PaymentLaunchResult = {status: 'success' | 'cancelled' | 'failed' | 'unknown'; payload?: Record<string, unknown>};

export type RazorpayLaunch = {
  keyId: string;
  orderId: string;
  currency: string;
  description?: string;
  method?: 'upi' | 'card' | 'netbanking' | 'wallet';
  prefill?: {name?: string; email?: string; contact?: string};
};

type RazorpaySuccess = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayFailure = {
  code?: number | string;
  description?: string;
};

function razorpayCheckout() {
  // Loaded at call time so a missing native rebuild surfaces as a payment error, not an import crash.
  const checkout = require('react-native-razorpay').default as {
    open: (options: Record<string, unknown>) => Promise<RazorpaySuccess>;
  };
  return checkout;
}

function razorpayCancelled(error: RazorpayFailure) {
  const description = `${error.description ?? ''}`;
  const code = `${error.code ?? ''}`;
  // Razorpay Checkout uses code 2 when the learner closes the sheet.
  return code === '2' || /cancel/i.test(description);
}

function razorpayOptions(amountMinor: number, checkout: RazorpayLaunch) {
  const prefill = {
    ...(checkout.prefill?.name ? {name: checkout.prefill.name} : {}),
    ...(checkout.prefill?.email ? {email: checkout.prefill.email} : {}),
    ...(checkout.prefill?.contact ? {contact: checkout.prefill.contact} : {}),
  };
  const instrument = checkout.method ? [{method: checkout.method}] : [{method: 'upi'}, {method: 'card'}, {method: 'netbanking'}, {method: 'wallet'}];
  return {
    key: checkout.keyId,
    amount: String(Math.round(amountMinor)),
    currency: checkout.currency || 'INR',
    name: 'RACI',
    description: checkout.description || 'Course enrollment',
    order_id: checkout.orderId,
    ...(Object.keys(prefill).length ? {prefill} : {}),
    theme: {color: '#1565C0'},
    retry: {enabled: false, max_count: 0},
    config: {
      display: {
        blocks: {
          preferred: {
            name: 'Pay using',
            instruments: instrument,
          },
        },
        sequence: ['block.preferred'],
        preferences: {show_default_blocks: !checkout.method},
      },
    },
  };
}

export type StoreProduct = {productId: string; formattedPrice: string; currency: string; priceMicros: number};

export const paymentService = {
  async product(productId: string): Promise<StoreProduct> {
    if (!NativeModules.RaciBilling) throw new Error('Google Play purchases are unavailable on this device.');
    return NativeModules.RaciBilling.getProduct(productId);
  },
  async restore(): Promise<Record<string, unknown>[]> {
    if (!NativeModules.RaciBilling) throw new Error('Google Play purchases are unavailable on this device.');
    return NativeModules.RaciBilling.restore();
  },
  async launch(orderId: string, amountMinor: number, product?: StoreProduct, accountId?: string, razorpay?: RazorpayLaunch): Promise<PaymentLaunchResult> {
    if (razorpay?.keyId && razorpay.orderId) {
      try {
        const paid = await razorpayCheckout().open(razorpayOptions(amountMinor, razorpay));
        if (!paid?.razorpay_payment_id || !paid.razorpay_signature) return {status: 'unknown'};
        return {
          status: 'success',
          payload: {
            provider: 'razorpay',
            orderId: paid.razorpay_order_id || razorpay.orderId,
            razorpay_order_id: paid.razorpay_order_id || razorpay.orderId,
            razorpay_payment_id: paid.razorpay_payment_id,
            razorpay_signature: paid.razorpay_signature,
          },
        };
      } catch (error) {
        const failure = (error ?? {}) as RazorpayFailure;
        if (razorpayCancelled(failure)) return {status: 'cancelled'};
        if (failure.description || failure.code !== undefined) return {status: 'failed'};
        throw new Error('Razorpay checkout is not ready. Rebuild the app and try again.');
      }
    }
    if (appConfig.capabilities.payments && appConfig.paymentRoute === 'play_billing' && NativeModules.RaciBilling && product && accountId) {
      return NativeModules.RaciBilling.purchase(product.productId, product.priceMicros, product.currency, accountId);
    }
    if (__DEV__) {
      return {status: 'success', payload: {provider: 'dev', orderId, amountMinor}};
    }
    throw new Error('This purchase is not available yet.');
  },
};

export const videoService = {
  provider: appConfig.videoProvider,
};

export const liveSessionService = {
  provider: appConfig.liveProvider,
};

export const speechService = {
  available: appConfig.capabilities.speechSearch,
  async transcribe(): Promise<string> {
    throw new Error('Speech recognition is not configured on this build.');
  },
};

export const shareService = {
  async share(message: string, url?: string) {
    await Share.share({message: url ? `${message}\n${url}` : message});
  },
  async openUrl(url: string) {
    try {
      if (!/^https:\/\/[^/\s]+/i.test(url) || /^https:\/\/[^/]*@/i.test(url)) throw new Error('This link is unavailable.');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link', 'Please try again or contact support.');
    }
  },
};

export const downloadService = {
  async enqueue(url: string, fileName: string) {
    if (!/^https:\/\//i.test(url) || !/^[a-zA-Z0-9._-]+$/.test(fileName) || fileName.includes('..')) throw new Error('Invalid download.');
    await ensureCourseStorage();
    const network = await NetInfo.fetch();
    if (!network.isConnected) throw new Error('Connect to the internet to download this file.');
    if (await getPreference('wifiOnly', true) && network.type !== 'wifi') throw new Error('Connect to Wi-Fi or change your download preference in Settings.');
    const directory = `${RNBlobUtil.fs.dirs.DocumentDir}/redi`;
    if (!await RNBlobUtil.fs.exists(directory)) await RNBlobUtil.fs.mkdir(directory);
    const path = `${RNBlobUtil.fs.dirs.DocumentDir}/redi/${fileName}`;
    const result = await RNBlobUtil.config({path, fileCache: true}).fetch('GET', url);
    if (result.info().status < 200 || result.info().status >= 300) {
      await RNBlobUtil.fs.unlink(path).catch(() => {});
      throw new Error('The download could not be completed.');
    }
    return result.path();
  },
};

export const notificationService = {
  async register(): Promise<void> {
    return;
  },
  async unregister(): Promise<void> {
    return;
  },
};
