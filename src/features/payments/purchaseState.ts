import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Order} from '../../core/types';

type PurchaseState = {productId: string; key: string; orderId?: string};
const storageKey = (owner: string) => `redi.purchase.${encodeURIComponent(owner)}`;
export const terminalOrder = (status: Order['status']) => ['succeeded', 'failed', 'cancelled'].includes(status);
export const orderLabel = (status: Order['status']) => ({
  idle: 'Not started', creatingOrder: 'Preparing order', awaitingProvider: 'Awaiting payment', verifying: 'Confirming payment',
  paidAccessPending: 'Activating access', succeeded: 'Completed', cancelled: 'Cancelled', failed: 'Not completed', unknownNeedsRecheck: 'Checking status',
})[status];
export async function readPurchase(owner: string): Promise<PurchaseState | null> {
  const raw = await AsyncStorage.getItem(storageKey(owner));
  if (!raw) return null;
  const value = JSON.parse(raw) as PurchaseState;
  if (!value.productId || !value.key) throw new Error('Your pending purchase could not be restored. Use Restore purchases in payment history.');
  return value;
}
// Purchase records must be durable before opening a payment sheet. These writes
// intentionally propagate storage failures, unlike optional UI preferences.
export async function writePurchase(owner: string, state: PurchaseState) {
  await AsyncStorage.setItem(storageKey(owner), JSON.stringify(state));
}
export async function clearPurchase(owner: string, orderId: string) {
  if ((await readPurchase(owner))?.orderId === orderId) await AsyncStorage.removeItem(storageKey(owner));
}
