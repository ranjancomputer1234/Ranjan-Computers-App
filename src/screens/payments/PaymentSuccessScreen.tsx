import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {accountKey} from '../../core/session';
import {queryClient} from '../../core/query';
import {Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {Icon} from '../../assets/icons';
import {shareService} from '../../core/services';
import type {RootNav} from '../../navigation/types';
import {styles} from './styles';
import {inr} from '../../features/payments/utils/inr';
import {
  formatPaidAt,
  methodLine,
  primaryCta,
  receiptMessage,
  unlockCopy,
} from '../../features/payments/utils/receipt';

export function PaymentSuccessScreen() {
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
    if (data?.status === 'succeeded') {
      void queryClient.invalidateQueries({
        predicate: query => !['order', 'order-pending'].includes(String(query.queryKey[0])),
      });
      Animated.spring(pop, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [data?.status, pop]);

  if (order.isLoading) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }
  if (order.isError) {
    return (
      <Screen>
        <ErrorState message="We could not confirm the purchase yet." onRetry={() => void order.refetch()} />
      </Screen>
    );
  }
  if (data?.status !== 'succeeded') {
    return (
      <Screen>
        <AppText>Your order is awaiting confirmation.</AppText>
        <ClayButton label="Check payment status" onPress={() => navigation.replace('PaymentPending', {orderId})} />
      </Screen>
    );
  }

  const amount = inr(data.quote.totalMinor, data.quote.currency);
  const mrp = data.quote.mrpMinor > data.quote.totalMinor ? inr(data.quote.mrpMinor, data.quote.currency) : null;
  const cta = primaryCta(data);
  const scale = pop.interpolate({inputRange: [0, 1], outputRange: [0.4, 1]});

  const goLearning = () =>
    navigation.replace('Main', {screen: 'LearningTab', params: {screen: 'MyLearning'}});
  const goPrimary = () => {
    if (cta.kind === 'tests') {
      navigation.replace('Main', {screen: 'HomeTab', params: {screen: 'TestList'}});
      return;
    }
    goLearning();
  };
  const goLive = () => navigation.replace('Main', {screen: 'LiveTab', params: {screen: 'LiveSchedule'}});
  const shareReceipt = () => void shareService.share(receiptMessage(data));

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View style={{transform: [{scale}], opacity: pop}}>
            <View style={[styles.ring, styles.ringGreen]}>
              <Gradient colors={['#F1F8E9', '#C8E6C9']} start={{x: 0.32, y: 0.28}} end={{x: 1, y: 1}} style={styles.ringFill}>
                <Icon name="check" size={40} color={colors.success} />
              </Gradient>
            </View>
          </Animated.View>
          <AppText weight="900" size={20} color={colors.navy} center style={styles.heroTitle}>
            Payment Successful!
          </AppText>
          <AppText weight="600" size={11} color={colors.text2} style={styles.heroSub}>
            {amount} paid via {methodLine(data)}
          </AppText>
        </View>

        <View style={styles.receipt}>
          <View style={styles.receiptHead}>
            <AppText weight="800" size={16.5} color={colors.navy}>
              Receipt
            </AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Share receipt" onPress={shareReceipt} hitSlop={8}>
              <AppText weight="700" size={11.5} color={colors.primary}>
                Share
              </AppText>
            </Pressable>
          </View>
          <View style={styles.receiptRows}>
            <ReceiptRow label="Item" value={data.title} />
            <ReceiptRow
              label="Amount"
              value={
                <AppText weight="700" size={10.5} color={colors.ink} style={styles.receiptValue}>
                  {amount}
                  {mrp ? (
                    <AppText size={10.5} color={colors.text3} style={styles.mrpStrike}>
                      {' '}
                      {mrp}
                    </AppText>
                  ) : null}
                </AppText>
              }
            />
            <ReceiptRow label="Method" value={methodLine(data)} />
            <ReceiptRow label="Date & Time" value={formatPaidAt(data.paidAt)} />
            <ReceiptRow label="Txn ID" value={data.id} mono onPress={shareReceipt} />
            {data.receiptId ? <ReceiptRow label="Ref No." value={data.receiptId} mono onPress={shareReceipt} /> : null}
          </View>
        </View>

        <View style={styles.okStrip} accessibilityRole="text">
          <Icon name="check" size={18} color={colors.success} />
          <AppText weight="800" size={11.5} color={colors.success} style={styles.stripText}>
            {unlockCopy(data)}
          </AppText>
        </View>

        <View style={styles.dualRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={cta.label}
            onPress={goPrimary}
            style={({pressed}) => [styles.dualBtn, {opacity: pressed ? 0.9 : 1}]}>
            <Gradient colors={gradients.primaryButton} style={styles.btnSolid}>
              <AppText weight="800" size={12} color="#fff" center numberOfLines={2}>
                {cta.label}
              </AppText>
            </Gradient>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to My Learning"
            onPress={goLearning}
            style={({pressed}) => [styles.btnOut, styles.dualBtn, pressed && styles.pressed]}>
            <AppText weight="800" size={12} color={colors.primary} center numberOfLines={2}>
              Go to My Learning
            </AppText>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Browse live classes" onPress={goLive}>
          <Gradient colors={gradients.semesterWait} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.tipBanner}>
            <View style={styles.tipCopy}>
              <Gradient colors={['#FFD54F', '#FFA000']} style={styles.tipPill}>
                <AppText weight="800" size={9} color="#fff">
                  TIP
                </AppText>
              </Gradient>
              <AppText weight="800" size={15} color="#fff">
                Pair mocks with live classes
              </AppText>
              <AppText weight="500" size={11} color="rgba(255,255,255,0.88)">
                Free doubt-clearing session with every pack
              </AppText>
            </View>
            <View style={styles.tipArt}>
              <Icon name="live" size={64} color="rgba(255,255,255,0.85)" />
            </View>
          </Gradient>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  onPress,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  onPress?: () => void;
}) {
  const content =
    typeof value === 'string' ? (
      <AppText weight="700" size={mono ? 9.5 : 10.5} color={colors.ink} face={mono ? 'mono' : 'inter'} style={styles.receiptValue}>
        {value}
      </AppText>
    ) : (
      value
    );

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      onLongPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={styles.receiptRow}>
      <AppText weight="600" size={10.5} color={colors.text2} style={styles.receiptLabel}>
        {label}
      </AppText>
      {content}
    </Pressable>
  );
}
