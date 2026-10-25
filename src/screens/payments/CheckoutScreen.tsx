import React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {clay, colors, gradients} from '../../theme';
import {AppText, ErrorState, FormField, LoadingBlock} from '../../components/ui';
import {ClayButton, ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen, StickyActionFooter} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {Icon} from '../../assets/icons';
import {useCheckout} from '../../features/payments/hooks/useCheckout';
import {catalogOffPercent} from '../../features/payments/methods';
import {inr} from '../../features/payments/utils/inr';
import type {PaymentMethodView} from '../../features/payments/methods';
import {styles} from './styles';

export function CheckoutScreen() {
  const {
    navigation,
    coupon,
    setCoupon,
    appliedCoupon,
    couponError,
    submitCoupon,
    removeCoupon,
    method,
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
  } = useCheckout();

  const offPercent = data ? catalogOffPercent(data) : 0;
  const selling = data ? data.totalMinor + (data.couponDiscountMinor ?? 0) : 0;
  const couponSaved = data?.couponDiscountMinor ?? 0;
  const couponApplied = Boolean(appliedCoupon && data?.coupon === appliedCoupon);
  const busy = pay.isPending || quote.isFetching;
  const canPay = Boolean(data) && !busy && !unavailable && !expired && (!inAppCheckout || Boolean(method));

  return (
    <Screen padded={false}>
      <DetailHeader
        title="Checkout"
        subtitle={data?.title}
        onBack={() => navigation.goBack()}
        right={<SecureBadge />}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.checkoutPage} showsVerticalScrollIndicator={false}>
        {quote.isLoading && !data ? <LoadingBlock /> : null}
        {quote.isError && !data ? <ErrorState message="Could not load this order." onRetry={() => void quote.refetch()} /> : null}

        {data ? (
          <View style={styles.summary}>
            <View style={styles.shead}>
              <AppText weight="800" size={16.5} color={colors.navy} style={{letterSpacing: -0.2}}>
                Order Summary
              </AppText>
              {countdown && !countdown.expired ? (
                <AppText size={9.5} weight="600" color={colors.text3} face="mono">
                  Quote {countdown.label}
                </AppText>
              ) : null}
            </View>
            <View style={styles.summaryRows}>
              <View style={styles.ordrow}>
                <AppText weight="600" size={11} style={styles.ordLabel} numberOfLines={2}>
                  {data.title}
                </AppText>
                <AppText weight="800" size={12} color={colors.navy}>
                  {inr(selling, data.currency)}
                </AppText>
              </View>
              {data.mrpMinor > selling ? (
                <View style={styles.ordrow}>
                  <AppText size={11} color={colors.text3} style={styles.mrpStrike}>
                    MRP {inr(data.mrpMinor, data.currency)}
                  </AppText>
                  {offPercent > 0 ? (
                    <Gradient colors={gradients.freeBadge} style={styles.recBadge}>
                      <AppText weight="800" size={8.5} color="#fff" style={{letterSpacing: 0.8}}>
                        {offPercent}% OFF
                      </AppText>
                    </Gradient>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.divider} />
              <View style={styles.ordrow}>
                <AppText weight="800" size={11} color={colors.navy}>
                  Total Payable
                </AppText>
                <AppText weight="800" size={15} color={colors.success}>
                  {payableLabel || inr(data.totalMinor, data.currency)}
                </AppText>
              </View>
            </View>
            {expired ? (
              <AppText size={11} color={colors.error}>
                This price expired. Review the updated total before paying.
              </AppText>
            ) : null}
          </View>
        ) : null}

        {inAppCheckout ? (
          couponApplied && data ? (
            <View style={styles.couponRow}>
              <Icon name="check" size={16} color={colors.success} />
              <AppText weight="700" size={11} color={colors.success} style={styles.couponCopy}>
                Coupon <AppText weight="800" size={11} color={colors.success}>{appliedCoupon}</AppText>
                {' '}applied · saved {inr(couponSaved, data.currency)}
              </AppText>
              <Pressable onPress={removeCoupon} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove coupon">
                <AppText weight="800" size={10} color="#C62828">
                  Remove
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View>
              <View style={styles.couponComposer}>
                <View style={styles.couponField}>
                  <FormField
                    value={coupon}
                    onChangeText={text => {
                      setCoupon(text.toUpperCase());
                    }}
                    label="Coupon code"
                    placeholder="Enter code"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={submitCoupon}
                  />
                </View>
                <ClayButton label="Apply" compact disabled={busy || !coupon.trim()} onPress={submitCoupon} />
              </View>
              {couponError ? (
                <AppText size={11} color={colors.error} style={{marginTop: 6}}>
                  {couponError}
                </AppText>
              ) : (
                <AppText size={10.5} color={colors.text3} style={{marginTop: 6}}>
                  Have a code from RACI? Apply it before you pay.
                </AppText>
              )}
            </View>
          )
        ) : null}

        {inAppCheckout ? (
          <>
            <View style={styles.shead}>
              <AppText weight="800" size={16.5} color={colors.navy} style={{letterSpacing: -0.2}}>
                Payment Method
              </AppText>
            </View>
            <View style={styles.payGroup}>
              {availableMethods.map(item => {
                const selected = method === item.id;
                return (
                  <View key={item.id} style={{gap: 8}}>
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{selected}}
                      accessibilityLabel={item.label}
                      onPress={() => {
                        if (selected) setExpanded(current => (current === item.id ? undefined : item.id));
                        else {
                          setMethod(item.id);
                          setExpanded(item.id === 'upi' ? undefined : item.id);
                        }
                      }}
                      style={({pressed}) => [styles.payRow, selected && styles.payRowOn, pressed && styles.pressed]}>
                      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
                      <View style={[styles.payIcon, {backgroundColor: clay[item.clay].bg}]}>
                        <Icon name={item.icon} size={17} color={item.iconColor} />
                      </View>
                      <View style={styles.payCopy}>
                        <AppText weight="800" size={11.5} color={colors.navy}>
                          {item.label}
                        </AppText>
                        <AppText weight="500" size={9} color={colors.text2}>
                          {item.hint}
                        </AppText>
                      </View>
                      <MethodAccessory item={item} />
                    </Pressable>
                    {selected && expanded === item.id ? (
                      <MethodDetails
                        item={item}
                        instrument={instrument}
                        onSelect={setInstrument}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </>
        ) : data && !quote.isLoading ? (
          <ClayCard variant="sky">
            <AppText weight="800" color={colors.navy}>
              Pay with {storeProduct.data ? 'Google Play' : 'the app store'}
            </AppText>
            <AppText size={12} color={colors.text2}>
              Choose from the payment methods in your store account. The final price is confirmed on the secure purchase sheet.
            </AppText>
          </ClayCard>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('PublicLegal', {slug: 'terms'})}
          accessibilityRole="link"
          accessibilityLabel="Read payment and refund policy">
          <View style={styles.trust}>
            <Icon name="shield" size={18} color={colors.success} />
            <AppText weight="500" size={10} color={colors.text2} style={styles.trustCopy}>
              Payments are encrypted in transit. Refunds follow the institute’s published policy — tap to read terms before you pay.
            </AppText>
          </View>
        </Pressable>

        {unavailable && !storeProduct.isFetching && !quote.isLoading ? (
          <ErrorState
            message="This purchase is currently unavailable. Please try again later."
            onRetry={() => {
              void quote.refetch();
              if (data?.storeProductId) void storeProduct.refetch();
            }}
          />
        ) : null}
      </ScrollView>
      <StickyActionFooter>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pay.isPending ? 'Processing payment' : `Pay ${payableLabel || ''} securely`}
          disabled={!canPay}
          onPress={() => pay.mutate()}
          style={({pressed}) => [{width: '100%', opacity: !canPay ? 0.5 : pressed ? 0.9 : 1}]}>
          <Gradient colors={['#FB8C00', '#F57C00']} style={styles.payCta}>
            <Icon name="lock" size={14} color="#fff" />
            <AppText weight="800" size={13} color="#fff">
              {pay.isPending ? 'Processing…' : `Pay ${payableLabel || ''} Securely`}
            </AppText>
          </Gradient>
        </Pressable>
      </StickyActionFooter>
    </Screen>
  );
}

function SecureBadge() {
  return (
    <View style={styles.secure} accessibilityLabel="Secure checkout">
      <Icon name="lock" size={13} color={colors.success} />
      <AppText weight="600" size={10} color={colors.success}>
        Secure
      </AppText>
    </View>
  );
}

function MethodAccessory({item}: {item: PaymentMethodView}) {
  if (item.accessory === 'recommended') {
    return (
      <Gradient colors={gradients.freeBadge} style={styles.recBadge}>
        <AppText weight="800" size={8.5} color="#fff" style={{letterSpacing: 0.8}}>
          RECOMMENDED
        </AppText>
      </Gradient>
    );
  }
  if (item.accessory === 'add') {
    return (
      <AppText weight="600" size={9.5} color={colors.text3} style={styles.addLabel}>
        + Add
      </AppText>
    );
  }
  return <Icon name="chev" size={14} color="#B0BEC5" />;
}

function MethodDetails({
  item,
  instrument,
  onSelect,
}: {
  item: PaymentMethodView;
  instrument?: string;
  onSelect: (value: string) => void;
}) {
  if (item.id === 'card') {
    return (
      <View style={styles.cardHint}>
        <AppText weight="600" size={11} color={colors.text2} style={{lineHeight: 16}}>
          Card number, expiry and CVV are entered on the next secure payment step. RACI never stores your card details.
        </AppText>
      </View>
    );
  }
  if (!item.options?.length) return null;
  return (
    <View style={styles.optionWrap}>
      {item.options.map(option => {
        const on = instrument === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            onPress={() => onSelect(option)}
            style={[styles.optionChip, on && styles.optionChipOn]}>
            <AppText weight="700" size={10.5} color={on ? colors.activeBlue : colors.navy}>
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
