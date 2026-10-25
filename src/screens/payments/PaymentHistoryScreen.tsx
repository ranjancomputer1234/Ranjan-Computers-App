import React from 'react';
import {ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey} from '../../core/session';
import {colors} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {paymentService} from '../../core/services';
import {useAsyncAction} from '../../core/useAsyncAction';
import {appConfig} from '../../core/config';
import {queryClient} from '../../core/query';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../../navigation/types';
import {styles} from './styles';
import {clearPurchase, orderLabel, readPurchase, terminalOrder} from '../../features/payments/purchaseState';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function PaymentHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const repos = useRepositories();
  const orders = useQuery({queryKey: queryKeys.orders(accountKey()), queryFn: () => repos.commerce.history()});
  const restore = useAsyncAction(async () => {
    const purchases = await paymentService.restore();
    const restored = await repos.commerce.restore(purchases);
    for (const order of restored) if (terminalOrder(order.status)) await clearPurchase(accountKey(), order.id);
    await queryClient.invalidateQueries();
  });
  const pending = useQuery({queryKey: ['pending-purchase', accountKey()], queryFn: () => readPurchase(accountKey()), networkMode: 'always'});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: orders.isRefetching || pending.isRefetching,
    onRefresh: () => {
      Promise.all([orders.refetch(), pending.refetch()]).catch(() => undefined);
    },
  });
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Payment History" onBack={() => navigation.goBack()} />
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
        {appConfig.capabilities.payments ? <ClayButton label={restore.busy ? 'Checking purchases…' : 'Restore Google Play purchases'} disabled={restore.busy} onPress={() => void restore.run()} /> : null}
        {restore.error ? <AppText color={colors.error}>{restore.error}</AppText> : null}
        {pending.data?.orderId ? <ClayButton label="Check interrupted purchase" tone="ghost" onPress={() => navigation.navigate('OrderDetail', {orderId: pending.data!.orderId!})} /> : null}
        {orders.isLoading ? <LoadingBlock /> : null}
        {orders.isError ? <ErrorState message="Could not load purchases." onRetry={() => void orders.refetch()} /> : null}
        {orders.data?.map(order => (
          <ClayCard key={order.id} variant="white" onPress={() => navigation.navigate('OrderDetail', {orderId: order.id})}>
            <AppText weight="800">{order.title}</AppText>
            <AppText size={12}>{orderLabel(order.status)}</AppText>
          </ClayCard>
        ))}
        {!orders.isLoading && !orders.isError && !orders.data?.length ? <AppText color={colors.text2}>No orders yet.</AppText> : null}
      </ScrollView>
    </Screen>
  );
}
