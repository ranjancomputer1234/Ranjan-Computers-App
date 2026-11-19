import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../theme';
import {AppText, FormField} from '../../components/ui';
import {Gradient} from '../../components/ui/Gradient';
import {Icon} from '../../assets/icons';
import {
  BANKS,
  UPI_APPS,
  WALLETS,
  cardLabel,
  formatCardNumber,
  formatExpiry,
  savedCardFrom,
  validateCard,
  validateSavedCvv,
  validateUpiId,
  type SavedCard,
} from '../../features/payments/paymentInstruments';
import type {PaymentMethodId} from '../../core/types';
import {styles} from './styles';

export type PaymentDraft = {methodDetail: string; saveCard?: SavedCard};

type Props = {
  visible: boolean;
  method?: PaymentMethodId;
  amountLabel: string;
  busy: boolean;
  savedCards: SavedCard[];
  onClose: () => void;
  onConfirm: (draft: PaymentDraft) => void;
};

export function PaymentSheet({visible, method, amountLabel, busy, savedCards, onClose, onConfirm}: Props) {
  const insets = useSafeAreaInsets();
  const [upiApp, setUpiApp] = useState<string>();
  const [upiId, setUpiId] = useState('');
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [bank, setBank] = useState<string>();
  const [wallet, setWallet] = useState<string>();
  const [savedId, setSavedId] = useState<string>();
  const [savedCvv, setSavedCvv] = useState('');
  const [addingCard, setAddingCard] = useState(false);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setUpiApp(undefined);
    setUpiId('');
    setBank(undefined);
    setWallet(undefined);
    setSavedId(savedCards[0]?.id);
    setSavedCvv('');
    setAddingCard(savedCards.length === 0);
    setNumber('');
    setName('');
    setExpiry('');
    setCvv('');
    setSaveCard(true);
    setError('');
    // Reset only when the sheet opens or the method changes. Saved cards are already loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, method]);

  useEffect(() => {
    if (!visible || method !== 'upi') return;
    let cancel = false;
    void Promise.all(
      UPI_APPS.map(async app => {
        try {
          return [app.id, await Linking.canOpenURL(app.probe)] as const;
        } catch {
          return [app.id, false] as const;
        }
      }),
    ).then(rows => {
      if (!cancel) setInstalled(new Set(rows.filter(([, ok]) => ok).map(([id]) => id)));
    });
    return () => {
      cancel = true;
    };
  }, [visible, method]);

  const title =
    method === 'upi' ? 'Choose a UPI app' : method === 'card' ? 'Pay with card' : method === 'netbanking' ? 'Choose your bank' : 'Choose a wallet';
  const subtitle =
    method === 'upi'
      ? 'Google Pay, PhonePe, Paytm, BHIM, or a UPI ID.'
      : method === 'card'
        ? 'Use a saved card or enter a new one. The CVV is not stored.'
        : method === 'netbanking'
          ? 'You will continue with the bank you select.'
          : 'Pick the wallet you want to pay from.';

  const confirm = () => {
    if (busy) return;
    if (method === 'upi') {
      if (upiApp) {
        const label = UPI_APPS.find(app => app.id === upiApp)?.label ?? upiApp;
        if (installed.size > 0 && !installed.has(upiApp)) {
          setError(`${label} is not installed on this phone. Choose another app or enter a UPI ID.`);
          return;
        }
        setError('');
        onConfirm({methodDetail: label});
        return;
      }
      if (!validateUpiId(upiId)) {
        setError('Choose a UPI app or enter a UPI ID such as name@okaxis.');
        return;
      }
      setError('');
      onConfirm({methodDetail: upiId.trim()});
      return;
    }
    if (method === 'card') {
      if (!addingCard && savedId) {
        const card = savedCards.find(item => item.id === savedId);
        if (!card) {
          setError('Choose a saved card or enter a new one.');
          return;
        }
        const cvvError = validateSavedCvv(card.brand, savedCvv);
        if (cvvError) {
          setError(cvvError);
          return;
        }
        setError('');
        onConfirm({methodDetail: `${card.brand} ···· ${card.last4}`});
        return;
      }
      const cardError = validateCard({number, name, expiry, cvv});
      if (cardError) {
        setError(cardError);
        return;
      }
      const card = savedCardFrom({number, name, expiry});
      setError('');
      onConfirm({methodDetail: cardLabel(number), saveCard: saveCard ? card : undefined});
      return;
    }
    if (method === 'netbanking') {
      if (!bank) {
        setError('Choose a bank to continue.');
        return;
      }
      setError('');
      onConfirm({methodDetail: bank});
      return;
    }
    if (!wallet) {
      setError('Choose a wallet to continue.');
      return;
    }
    setError('');
    onConfirm({methodDetail: wallet});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={busy ? undefined : onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetRoot}>
        <Pressable style={{flex: 1}} disabled={busy} onPress={onClose} accessibilityLabel="Close payment options" />
        <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <View style={styles.sheetCopy}>
              <AppText weight="800" size={17} color={colors.navy}>
                {title}
              </AppText>
              <AppText size={11.5} color={colors.text2} style={{lineHeight: 16}}>
                {subtitle}
              </AppText>
            </View>
            <Pressable onPress={onClose} disabled={busy} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <AppText weight="800" size={12} color={colors.primary}>
                Close
              </AppText>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetList}>
            {method === 'upi' ? (
              <>
                {UPI_APPS.map(app => {
                  const selected = upiApp === app.id;
                  return (
                    <Choice
                      key={app.id}
                      label={app.label}
                      selected={selected}
                      icon={app.id === 'gpay' ? 'gpay' : 'zap'}
                      badge={installed.has(app.id) ? 'Installed' : undefined}
                      onPress={() => {
                        setUpiApp(app.id);
                        setUpiId('');
                        setError('');
                      }}
                    />
                  );
                })}
                <View style={styles.orLine}>
                  <View style={styles.orRule} />
                  <AppText weight="700" size={10} color={colors.text3}>
                    OR UPI ID
                  </AppText>
                  <View style={styles.orRule} />
                </View>
                <FormField
                  label="UPI ID"
                  value={upiId}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="name@okaxis"
                  onChangeText={text => {
                    setUpiId(text);
                    setUpiApp(undefined);
                    setError('');
                  }}
                />
              </>
            ) : null}
            {method === 'card' ? (
              <View style={styles.fieldStack}>
                {savedCards.map(card => {
                  const selected = !addingCard && savedId === card.id;
                  return (
                    <View key={card.id} style={{gap: 8}}>
                      <Choice
                        label={`${card.brand} ···· ${card.last4}`}
                        hint={`${card.name} · Expires ${card.expiry}`}
                        selected={selected}
                        icon="card"
                        onPress={() => {
                          setSavedId(card.id);
                          setAddingCard(false);
                          setSavedCvv('');
                          setError('');
                        }}
                      />
                      {selected ? (
                        <FormField
                          label="CVV"
                          value={savedCvv}
                          placeholder="•••"
                          keyboardType="number-pad"
                          secureTextEntry
                          maxLength={4}
                          onChangeText={text => {
                            setSavedCvv(text.replace(/\D/g, '').slice(0, 4));
                            setError('');
                          }}
                        />
                      ) : null}
                    </View>
                  );
                })}
                {savedCards.length && !addingCard ? (
                  <Pressable
                    onPress={() => {
                      setAddingCard(true);
                      setError('');
                    }}
                    style={styles.linkBtn}
                    accessibilityRole="button">
                    <AppText weight="800" size={12} color={colors.primary}>
                      Use a new card
                    </AppText>
                  </Pressable>
                ) : (
                  <>
                    <FormField
                      label="Card number"
                      value={number}
                      placeholder="1234 5678 9012 3456"
                      keyboardType="number-pad"
                      onChangeText={text => {
                        setNumber(formatCardNumber(text));
                        setError('');
                      }}
                    />
                    <FormField
                      label="Name on card"
                      value={name}
                      autoCapitalize="words"
                      placeholder="As printed on the card"
                      onChangeText={text => {
                        setName(text);
                        setError('');
                      }}
                    />
                    <View style={{flexDirection: 'row', gap: 10}}>
                      <View style={{flex: 1}}>
                        <FormField
                          label="Expiry"
                          value={expiry}
                          placeholder="MM/YY"
                          keyboardType="number-pad"
                          maxLength={5}
                          onChangeText={text => {
                            setExpiry(formatExpiry(text));
                            setError('');
                          }}
                        />
                      </View>
                      <View style={{flex: 1}}>
                        <FormField
                          label="CVV"
                          value={cvv}
                          placeholder="•••"
                          keyboardType="number-pad"
                          secureTextEntry
                          maxLength={4}
                          onChangeText={text => {
                            setCvv(text.replace(/\D/g, '').slice(0, 4));
                            setError('');
                          }}
                        />
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{checked: saveCard}}
                      onPress={() => setSaveCard(current => !current)}
                      style={styles.saveRow}>
                      <View style={[styles.checkBox, saveCard && styles.checkBoxOn]}>
                        {saveCard ? <Icon name="check" size={12} color={colors.primary} /> : null}
                      </View>
                      <AppText weight="600" size={11.5} color={colors.navy} style={{flex: 1}}>
                        Save this card for next time. Only the last 4 digits are kept on this phone.
                      </AppText>
                    </Pressable>
                    {savedCards.length ? (
                      <Pressable
                        onPress={() => {
                          setAddingCard(false);
                          setSavedId(savedCards[0]?.id);
                          setError('');
                        }}
                        style={styles.linkBtn}
                        accessibilityRole="button">
                        <AppText weight="800" size={12} color={colors.primary}>
                          Use a saved card
                        </AppText>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}
            {method === 'netbanking' ? BANKS.map(item => (
              <Choice key={item} label={item} selected={bank === item} icon="bank" onPress={() => { setBank(item); setError(''); }} />
            )) : null}
            {method === 'wallet' ? WALLETS.map(item => (
              <Choice key={item} label={item} selected={wallet === item} icon="rupee" onPress={() => { setWallet(item); setError(''); }} />
            )) : null}
            {error ? (
              <AppText size={11.5} color={colors.error}>
                {error}
              </AppText>
            ) : null}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={busy ? 'Processing payment' : `Pay ${amountLabel} securely`}
            disabled={busy}
            onPress={confirm}
            style={({pressed}) => [{opacity: busy ? 0.7 : pressed ? 0.92 : 1}]}>
            <Gradient colors={['#FB8C00', '#F57C00']} style={styles.payCta}>
              <Icon name="lock" size={14} color="#fff" />
              <AppText weight="800" size={13} color="#fff">
                {busy ? 'Processing…' : amountLabel ? `Pay ${amountLabel} Securely` : 'Pay Securely'}
              </AppText>
            </Gradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Choice({
  label,
  hint,
  selected,
  icon,
  badge,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  icon: 'gpay' | 'zap' | 'card' | 'bank' | 'rupee';
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{selected}}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceOn]}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={[styles.payIcon, {backgroundColor: colors.pastel.blue}]}>
        <Icon name={icon} size={16} color={colors.activeBlue} />
      </View>
      <View style={styles.payCopy}>
        <AppText weight="800" size={12} color={colors.navy}>
          {label}
        </AppText>
        {hint ? (
          <AppText weight="500" size={10} color={colors.text2}>
            {hint}
          </AppText>
        ) : null}
      </View>
      {badge ? (
        <View style={styles.installed}>
          <AppText weight="800" size={9} color={colors.success}>
            {badge}
          </AppText>
        </View>
      ) : (
        <Icon name="chev" size={14} color="#B0BEC5" />
      )}
    </Pressable>
  );
}
