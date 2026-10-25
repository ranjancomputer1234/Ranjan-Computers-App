import React from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey} from '../../core/session';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {styles} from './styles';
import type {RootNav} from '../../navigation/types';
import {colors} from '../../theme';
import {inr} from '../../features/payments/utils/inr';
import {formatPaidAt, methodLine} from '../../features/payments/utils/receipt';
import {orderLabel} from '../../features/payments/purchaseState';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

export function OrderDetailScreen() {
  const navigation = useNavigation<RootNav>();
  const orderId = (useRoute().params as {orderId: string}).orderId;
  const repos = useRepositories();
  const order = useQuery({queryKey: queryKeys.order(accountKey(), orderId), queryFn: () => repos.commerce.getOrder(orderId)});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: order.isRefetching,
    onRefresh: () => {
      order.refetch().catch(() => undefined);
    },
  });
  const data = order.data;
  const needsRecheck = data?.status === 'unknownNeedsRecheck' || data?.status === 'verifying' || data?.status === 'paidAccessPending';
  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title="Order" onBack={() => navigation.goBack()} />
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page}>
        {order.isLoading ? <LoadingBlock /> : null}
        {order.isError ? <ErrorState message="This order could not be found or loaded." onRetry={() => void order.refetch()} /> : null}
        {data ? (
          <>
            <ClayCard variant="white">
              <AppText weight="900" size={17}>{data.title}</AppText>
              <View style={{alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: data.status === 'succeeded' ? colors.pastel.green : data.status === 'failed' || data.status === 'cancelled' ? colors.pastel.red : colors.pastel.orange}}>
                <AppText weight="800" size={10} color={data.status === 'succeeded' ? colors.success : data.status === 'failed' || data.status === 'cancelled' ? colors.error : colors.orange}>
                  {orderLabel(data.status)}
                </AppText>
              </View>
              <View style={{gap: 10, marginTop: 4}}>
                <ReceiptLine label="Amount" value={inr(data.quote.totalMinor, data.quote.currency)} />
                <ReceiptLine label="Payment method" value={data.method ? methodLine(data) : 'Not selected'} />
                <ReceiptLine label="Date" value={data.paidAt ? formatPaidAt(data.paidAt) : 'Not completed'} />
                <ReceiptLine label="Product" value={data.productId} mono />
                <ReceiptLine label="Order ID" value={data.id} mono />
                {data.receiptId ? <ReceiptLine label="Reference" value={data.receiptId} mono /> : null}
              </View>
            </ClayCard>
            {needsRecheck ? (
              <ClayButton label={order.isFetching ? 'Checking…' : 'Recheck payment'} disabled={order.isFetching} onPress={() => void order.refetch()} />
            ) : null}
            {data.status === 'succeeded' ? (
              <ClayButton label="Open My Learning" onPress={() => navigation.navigate('Main', {screen: 'LearningTab', params: {screen: 'MyLearning'}})} />
            ) : null}
            {data.status === 'failed' || data.status === 'cancelled' ? (
              <ClayButton label="Try payment again" onPress={showLearnerUnavailable} />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ReceiptLine({label, value, mono}: {label: string; value: string; mono?: boolean}) {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16}}>
      <AppText size={11} color={colors.text2}>{label}</AppText>
      <AppText size={mono ? 9.5 : 11} weight="700" face={mono ? 'mono' : 'inter'} style={{flex: 1, textAlign: 'right'}}>{value}</AppText>
    </View>
  );
}
