import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '../../core/di';
import { accountKey } from '../../core/session';
import {
  AppText,
  ClayButton,
  ErrorState,
  LoadingBlock,
} from '../../components/ui';
import { ClayCard } from '../../components/ui/Clay';
import { DetailHeader, Screen } from '../../components/layout/Screen';
import type { RootNav } from '../../navigation/types';
import { styles } from './styles';
import {
  clearPurchase,
  terminalOrder,
} from '../../features/payments/purchaseState';

export function PaymentPendingScreen() {
  const navigation = useNavigation<RootNav>();
  const orderId = (useRoute().params as { orderId: string }).orderId;
  const repos = useRepositories();
  const order = useQuery({
    queryKey: ['order', accountKey(), orderId],
    queryFn: () => repos.commerce.getOrder(orderId),
    refetchInterval: query =>
      ['succeeded', 'failed', 'cancelled'].includes(
        query.state.data?.status ?? '',
      )
        ? false
        : 5000,
  });
  const orderStatus = order.data?.status;
  React.useEffect(() => {
    if (orderStatus && terminalOrder(orderStatus))
      void clearPurchase(accountKey(), orderId).catch(() => {});
    if (orderStatus === 'succeeded')
      navigation.replace('PaymentSuccess', { orderId });
    if (orderStatus === 'failed')
      navigation.replace('PaymentFailure', { orderId });
  }, [orderStatus, navigation, orderId]);
  const paid = orderStatus === 'paidAccessPending';
  const cancelled = orderStatus === 'cancelled';
  return (
    <Screen padded={false}>
      <DetailHeader title="Payment status" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.page}>
        {order.isLoading ? <LoadingBlock /> : null}
        {order.isError ? (
          <ErrorState
            message="We could not check this order. Please do not pay again until its status is confirmed."
            onRetry={() => void order.refetch()}
          />
        ) : null}
        <ClayCard variant={cancelled ? 'pink' : 'yellow'}>
          <AppText weight="800">
            {paid
              ? 'Payment received; activating access'
              : cancelled
              ? 'Purchase cancelled'
              : 'Checking your purchase'}
          </AppText>
          <AppText>
            {paid
              ? 'Your purchase is confirmed. Access is still being activated.'
              : cancelled
              ? 'This order was cancelled. You can try checkout again when ready.'
              : 'Your purchase has not been confirmed yet. Please do not pay again while we check its status.'}
          </AppText>
          <AppText size={11}>Order {orderId}</AppText>
          <ClayButton
            label="Refresh status"
            compact
            disabled={order.isFetching}
            onPress={() => void order.refetch()}
          />
        </ClayCard>
        {cancelled && order.data?.productId ? (
          <ClayButton
            label="Try checkout again"
            onPress={showLearnerUnavailable}
          />
        ) : null}
        <ClayButton
          label="View payment history"
          tone="ghost"
          onPress={() =>
            navigation.replace('Main', {
              screen: 'ProfileTab',
              params: { screen: 'PaymentHistory' },
            })
          }
        />
      </ScrollView>
    </Screen>
  );
}
