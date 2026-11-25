import React from 'react';
import {Alert, Pressable, TextInput, View} from 'react-native';
import {Icon} from '../../assets/icons';
import {AppText} from '../../components/ui';
import {
  LocationError,
  formFromResolved,
  locateCurrentAddress,
  openLocationSettings,
  resolvePlace,
  searchAddress,
  type ResolvedAddress,
} from '../../features/location/deviceLocation';
import {addressLabel, type AddressForm} from '../../features/location/address';
import {useUiTranslation} from '../../features/settings/uiTranslations';
import {colors} from '../../theme';
import {styles} from './styles';

type AddressFieldProps = {
  value: AddressForm;
  error?: string;
  onChange: (next: AddressForm) => void;
};

const LINES: Array<{key: 'addressLine1' | 'addressLine2' | 'city'; label: string; placeholder: string}> = [
  {key: 'addressLine1', label: 'Address line 1', placeholder: 'House no., street'},
  {key: 'addressLine2', label: 'Address line 2', placeholder: 'Area, landmark (optional)'},
  {key: 'city', label: 'City', placeholder: 'City'},
];

export function AddressField({value, error, onChange}: AddressFieldProps) {
  const tx = useUiTranslation();
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<ResolvedAddress[]>([]);
  const [status, setStatus] = React.useState<string | null>(null);
  const [locating, setLocating] = React.useState(false);
  const request = React.useRef(0);
  const chosenLabel = React.useRef<string | null>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === chosenLabel.current) {
      setSuggestions([]);
      return;
    }
    const current = ++request.current;
    const timer = setTimeout(() => {
      void searchAddress(trimmed).then(items => {
        if (current === request.current) setSuggestions(items);
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const apply = React.useCallback((place: ResolvedAddress) => {
    const next = formFromResolved(place);
    chosenLabel.current = place.label || addressLabel(next);
    setQuery(chosenLabel.current);
    setSuggestions([]);
    setStatus(null);
    onChangeRef.current(next);
  }, []);

  const choose = React.useCallback(async (place: ResolvedAddress) => {
    request.current += 1;
    setSuggestions([]);
    setLocating(true);
    setStatus(null);
    try {
      apply(await resolvePlace(place));
    } catch {
      apply(place);
      setStatus('That place could not be loaded. You can type the address.');
    } finally {
      setLocating(false);
    }
  }, [apply]);

  const readCurrentLocation = React.useCallback(async () => {
    setLocating(true);
    setStatus(null);
    try {
      apply(await locateCurrentAddress());
    } catch (failure) {
      const locationError = failure instanceof LocationError ? failure : null;
      const message = locationError?.message ?? 'Your address could not be read. Type your address instead.';
      setStatus(message);
      if (locationError?.code === 'location_permission_blocked') {
        Alert.alert(tx('Allow location'), tx(message), [
          {text: tx('Type address'), style: 'cancel'},
          {text: tx('Open settings'), onPress: () => { openLocationSettings().catch(() => undefined); }},
        ]);
      }
    } finally {
      setLocating(false);
    }
  }, [apply, tx]);

  const edit = (key: keyof AddressForm, nextValue: string) => {
    chosenLabel.current = null;
    onChange({
      ...value,
      [key]: nextValue,
      placeId: undefined,
    });
  };

  return (
    <View style={styles.signupField}>
      <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
        {tx('Search address')}
      </AppText>
      <View style={styles.signupInputSurface}>
        <Icon name="search" size={18} color={colors.text3} />
        <TextInput
          value={query}
          onChangeText={next => {
            chosenLabel.current = null;
            setQuery(next);
            setStatus(null);
          }}
          accessibilityLabel={tx('Search address')}
          placeholder={tx('Search a place or type your city')}
          placeholderTextColor={colors.text3}
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.signupTextInput}
        />
      </View>
      {suggestions.length ? (
        <View style={styles.suggestionList}>
          {suggestions.map(place => (
            <Pressable
              key={place.id}
              onPress={() => { void choose(place); }}
              accessibilityRole="button"
              style={({pressed}) => [styles.suggestionRow, pressed && styles.pressed]}>
              <Icon name="pin" size={14} color={colors.primary} />
              <AppText size={13} color={colors.ink} style={styles.suggestionLabel}>{place.label}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.locationPanel}>
        <Pressable
          onPress={() => { void readCurrentLocation(); }}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel={tx('Use current location')}
          style={({pressed}) => [styles.locationAction, pressed && styles.pressed, locating && styles.disabled]}>
          <Icon name="pin" size={16} color={colors.primary} />
          <AppText weight="700" size={14} color={colors.primary}>
            {locating ? tx('Finding your location…') : tx('Use current location')}
          </AppText>
        </Pressable>
        <AppText size={12} color={colors.text3} style={styles.locationCopy}>
          {tx('Location fills the address below. You can edit every line, or type it yourself.')}
        </AppText>
        {status ? (
          <AppText accessibilityRole="alert" size={12} color={colors.error} style={styles.locationCopy}>
            {tx(status)}
          </AppText>
        ) : null}
      </View>

      {LINES.map(line => (
        <View key={line.key} style={styles.signupField}>
          <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
            {tx(line.label)}
          </AppText>
          <View style={styles.signupInputSurface}>
            <Icon name="pin" size={18} color={colors.text3} />
            <TextInput
              value={value[line.key]}
              onChangeText={next => edit(line.key, line.key === 'city' ? next.slice(0, 100) : next)}
              accessibilityLabel={tx(line.label)}
              placeholder={tx(line.placeholder)}
              placeholderTextColor={colors.text3}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.signupTextInput}
            />
          </View>
        </View>
      ))}

      <View style={styles.addressRow}>
        <View style={[styles.signupField, styles.addressRowItem]}>
          <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
            {tx('State')}
          </AppText>
          <View style={styles.signupInputSurface}>
            <TextInput
              value={value.state}
              onChangeText={next => edit('state', next)}
              accessibilityLabel={tx('State')}
              placeholder={tx('State')}
              placeholderTextColor={colors.text3}
              autoCapitalize="words"
              style={styles.signupTextInput}
            />
          </View>
        </View>
        <View style={[styles.signupField, styles.addressRowItem]}>
          <AppText weight="700" size={12} color={colors.text2} style={styles.loginFieldLabel}>
            {tx('PIN code')}
          </AppText>
          <View style={[styles.signupInputSurface, error ? styles.signupInputError : null]}>
            <TextInput
              value={value.pincode}
              onChangeText={next => edit('pincode', next.replace(/\D/g, '').slice(0, 6))}
              accessibilityLabel={tx('PIN code')}
              placeholder={tx('6-digit PIN')}
              placeholderTextColor={colors.text3}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.signupTextInput}
            />
          </View>
        </View>
      </View>
      {error ? <AppText accessibilityRole="alert" size={12} color={colors.error}>{error}</AppText> : null}
    </View>
  );
}
