import React from 'react';
import {Pressable, View} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppText} from '../../components/ui';
import {KeyboardAwareScrollView} from '../../components/layout/KeyboardAwareScrollView';
import {Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {useRepositories} from '../../core/di';
import {useSessionStore} from '../../core/session';
import {useAsyncAction} from '../../core/useAsyncAction';
import {blankAddress, compactAddress, type AddressForm} from '../../features/location/address';
import {useUiTranslation} from '../../features/settings/uiTranslations';
import type {RootStackParamList} from '../../navigation/types';
import {colors, gradients} from '../../theme';
import {AddressField} from './AddressField';
import {styles} from './styles';

export function CompleteAddressScreen() {
  const tx = useUiTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const repos = useRepositories();
  const profile = useSessionStore(state => state.profile);
  const [address, setAddress] = React.useState<AddressForm>(() => blankAddress());
  const [error, setError] = React.useState<string | undefined>();

  const enterApp = React.useCallback(async () => {
    await useSessionStore.getState().dismissAddressPrompt();
    navigation.dispatch(CommonActions.reset({index: 0, routes: [{name: 'Main'}]}));
  }, [navigation]);

  const save = useAsyncAction(async () => {
    if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
      setError('Enter a 6-digit PIN code.');
      return;
    }
    setError(undefined);
    const next = compactAddress(address);
    if (Object.keys(next).length) {
      const saved = await repos.auth.updateMe(next);
      useSessionStore.getState().setProfile(saved);
    }
    await enterApp();
  });

  const firstName = profile?.fullName?.split(' ')[0];

  return (
    <Screen padded={false}>
      <KeyboardAwareScrollView
        style={styles.loginScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.loginPage}>
        <View style={styles.formCard}>
          <View style={styles.loginHeading}>
            <AppText weight="800" size={22} color={colors.navy} center>
              {tx('Add your address')}
            </AppText>
            <AppText weight="500" size={14} color={colors.text2} center>
              {firstName ? `${tx('Welcome')}, ${firstName}. ` : ''}
              {tx('Save your address so the institute knows where you learn from. You can skip this and add it later.')}
            </AppText>
          </View>
          <AddressField
            value={address}
            error={error}
            onChange={next => {
              setAddress(next);
              setError(undefined);
            }}
          />
          {save.error ? (
            <AppText accessibilityRole="alert" size={13} color={colors.error}>{save.error}</AppText>
          ) : null}
          <Pressable
            onPress={() => void save.run()}
            disabled={save.busy}
            accessibilityRole="button"
            style={({pressed}) => [styles.loginPressable, pressed && styles.pressed, save.busy && styles.disabled]}>
            <Gradient colors={gradients.primaryButton} style={styles.loginButton}>
              <AppText weight="700" size={16} color="#fff" center>
                {save.busy ? tx('Saving…') : tx('Save address')}
              </AppText>
            </Gradient>
          </Pressable>
          <Pressable
            onPress={() => { void enterApp(); }}
            disabled={save.busy}
            accessibilityRole="button"
            style={styles.loginLink}>
            <AppText weight="700" size={14} color={colors.primary}>{tx('Skip for now')}</AppText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </Screen>
  );
}
