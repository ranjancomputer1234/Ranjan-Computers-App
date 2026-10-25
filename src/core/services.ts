import {Alert, Share, Linking, NativeModules} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import NetInfo from '@react-native-community/netinfo';
import {appConfig} from './config';
import {getPreference} from './storage';

export type PaymentLaunchResult = {status: 'success' | 'cancelled' | 'failed' | 'unknown'; payload?: Record<string, unknown>};
export type StoreProduct = {productId: string; formattedPrice: string; currency: string; priceMicros: number};

export const paymentService = {
  async product(productId: string): Promise<StoreProduct> {
    if (!NativeModules.RediBilling) throw new Error('Google Play purchases are unavailable on this device.');
    return NativeModules.RediBilling.getProduct(productId);
  },
  async restore(): Promise<Record<string, unknown>[]> {
    if (!NativeModules.RediBilling) throw new Error('Google Play purchases are unavailable on this device.');
    return NativeModules.RediBilling.restore();
  },
  async launch(_orderId: string, _amountMinor: number, product?: StoreProduct, accountId?: string): Promise<PaymentLaunchResult> {
    if (appConfig.paymentRoute !== 'play_billing' || !NativeModules.RediBilling || !product || !accountId) {
      throw new Error('This purchase is not available yet.');
    }
    return NativeModules.RediBilling.purchase(product.productId, product.priceMicros, product.currency, accountId);
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
