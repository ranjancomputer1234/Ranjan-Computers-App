import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {showLearnerUnavailable} from '../../features/catalog/openPublishedTarget';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {accountKey} from '../../core/session';
import {Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {Icon} from '../../assets/icons';
import type {RootNav} from '../../navigation/types';
import {styles} from './styles';
import {inr} from '../../features/payments/utils/inr';
import {failureReason, formatPaidAt, methodLine} from '../../features/payments/utils/receipt';
import {clearPurchase, terminalOrder} from '../../features/payments/purchaseState';

const TIPS = [
  'Check your UPI / card balance and try again.',
  'Do not pay twice — wait for this order to settle first.',
  'If money was deducted, it usually returns in 3–5 bank working days.',
];

export function PaymentFailureScreen() {
  const navigation = useNavigation<RootNav>();
  const orderId = (useRoute().params as {orderId: string}).orderId;
  const repos = useRepositories();
  const order = useQuery({
    queryKey: ['order', accountKey(), orderId],
    queryFn: () => repos.commerce.getOrder(orderId),
    staleTime: 0,
  });
  const data = order.data;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (data && terminalOrder(data.status)) {
      void clearPurchase(accountKey(), orderId).catch(() => {});
    }
    if (data?.status === 'succeeded') {
      navigation.replace('PaymentSuccess', {orderId});
      return;
    }
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [data, data?.status, navigation, orderId, pop]);

  if (order.isLoading) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }
  if (order.isError || !data) {
    return (
      <Screen>
        <ErrorState message="We could not load this payment attempt." onRetry={() => void order.refetch()} />
      </Screen>
    );
  }

  const amount = inr(data.quote.totalMinor, data.quote.currency);
  const method = methodLine({method: data.method ?? data.quote.methods[0], methodDetail: data.methodDetail});
  const scale = pop.interpolate({inputRange: [0, 1], outputRange: [0.4, 1]});
  const reason = failureReason(data.status === 'cancelled' ? 'cancelled' : 'failed');

  const retry = () => showLearnerUnavailable();
  const history = () => showLearnerUnavailable();
  const help = () =>
    navigation.replace('Main', {screen: 'ProfileTab', params: {screen: 'HelpSupport'}});

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View style={{transform: [{scale}], opacity: pop}}>
            <View style={[styles.ring, styles.ringRed]}>
              <Gradient colors={['#FFEBEE', '#FFCDD2']} start={{x: 0.32, y: 0.28}} end={{x: 1, y: 1}} style={styles.ringFill}>
                <Icon name="shield" size={38} color="#C62828" />
              </Gradient>
            </View>
          </Animated.View>
          <AppText weight="900" size={20} color={colors.navy} center style={styles.heroTitle}>
            Payment Failed
          </AppText>
          <AppText weight="600" size={11} color={colors.text2} style={styles.heroSub}>
            {amount} via {method} could not be completed
          </AppText>
        </View>

        <View style={styles.receipt}>
          <View style={styles.receiptHead}>
            <AppText weight="800" size={16.5} color={colors.navy}>
              Attempt details
            </AppText>
            <AppText weight="700" size={11.5} color={colors.error}>
              Failed
            </AppText>
          </View>
          <View style={styles.receiptRows}>
            <DetailRow label="Item" value={data.title} />
            <DetailRow label="Amount" value={amount} />
            <DetailRow label="Method" value={method} />
            <DetailRow label="Tried at" value={formatPaidAt(data.paidAt ?? new Date().toISOString())} />
            <DetailRow label="Order ID" value={data.id} mono />
            <DetailRow label="Reason" value={reason} />
          </View>
        </View>

        <View style={styles.failStrip} accessibilityRole="text">
          <Icon name="lock" size={18} color="#C62828" />
          <AppText weight="800" size={11.5} color="#C62828" style={styles.stripText}>
            No access was granted. You were not charged for a completed purchase.
          </AppText>
        </View>

        <View style={styles.tipsCard}>
          <AppText weight="800" size={14} color={colors.navy}>
            What you can try
          </AppText>
          {TIPS.map((tip, index) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipDot}>
                <AppText weight="800" size={10} color={colors.orange}>
                  {index + 1}
                </AppText>
              </View>
              <AppText weight="600" size={11.5} color={colors.text2} style={styles.tipRowText}>
                {tip}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.dual}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try payment again"
            onPress={retry}
            style={({pressed}) => [{opacity: pressed ? 0.9 : 1}]}>
            <Gradient colors={gradients.primaryButton} style={styles.btnSolid}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Icon name="refresh" size={16} color="#fff" />
                <AppText weight="800" size={13} color="#fff">
                  Try Again
                </AppText>
              </View>
            </Gradient>
          </Pressable>
          <View style={styles.dualRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View payment history"
              onPress={history}
              style={({pressed}) => [styles.btnOut, styles.dualBtn, pressed && styles.pressed]}>
              <AppText weight="800" size={12} color={colors.primary} center>
                Payment History
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Get help"
              onPress={help}
              style={({pressed}) => [styles.btnOut, styles.dualBtn, pressed && styles.pressed]}>
              <AppText weight="800" size={12} color={colors.primary} center>
                Get Help
              </AppText>
            </Pressable>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Contact support" onPress={help}>
          <Gradient colors={['#B71C1C', '#E53935', '#EF5350']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.tipBanner}>
            <View style={styles.tipCopy}>
              <Gradient colors={['#FFD54F', '#FFA000']} style={styles.tipPill}>
                <AppText weight="800" size={9} color="#fff">
                  HELP
                </AppText>
              </Gradient>
              <AppText weight="800" size={15} color="#fff">
                Still seeing a bank debit?
              </AppText>
              <AppText weight="500" size={11} color="rgba(255,255,255,0.9)">
                Contact support with your Order ID — we’ll track it for you
              </AppText>
            </View>
            <View style={styles.tipArt}>
              <Icon name="help" size={58} color="rgba(255,255,255,0.88)" />
            </View>
          </Gradient>
        </Pressable>

        <ClayButton label="Back to Home" tone="ghost" onPress={() => navigation.replace('Main', {screen: 'HomeTab', params: {screen: 'Home'}})} />
      </ScrollView>
    </Screen>
  );
}

function DetailRow({label, value, mono}: {label: string; value: string; mono?: boolean}) {
  return (
    <View style={styles.receiptRow}>
      <AppText weight="600" size={10.5} color={colors.text2} style={styles.receiptLabel}>
        {label}
      </AppText>
      <AppText
        weight="700"
        size={mono ? 9.5 : 10.5}
        color={colors.ink}
        face={mono ? 'mono' : 'inter'}
        style={styles.receiptValue}>
        {value}
      </AppText>
    </View>
  );
}
