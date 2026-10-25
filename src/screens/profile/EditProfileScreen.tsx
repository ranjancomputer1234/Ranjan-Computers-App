import React from 'react';
import {Alert, Pressable, ScrollView, TextInput, View, type TextInputProps} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRepositories} from '../../core/di';
import {queryClient, queryKeys} from '../../core/query';
import {accountKey, useSessionStore} from '../../core/session';
import {useAsyncAction} from '../../core/useAsyncAction';
import {colors, gradients} from '../../theme';
import {AppText} from '../../components/ui';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {Icon, type IconName} from '../../assets/icons';
import type {ProfileStackParamList} from '../../navigation/types';
import {styles} from './styles';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

function digitsFromPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const repos = useRepositories();
  const profile = useSessionStore(state => state.profile);
  const initial = React.useMemo(
    () => ({
      name: profile?.fullName ?? '',
      email: profile?.email ?? '',
      phone: digitsFromPhone(profile?.phone),
      city: profile?.city ?? '',
    }),
    [profile],
  );
  const [name, setName] = React.useState(initial.name);
  const [phone, setPhone] = React.useState(initial.phone);
  const [city, setCity] = React.useState(initial.city);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const allowingLeave = React.useRef(false);

  React.useEffect(() => {
    setName(initial.name);
    setPhone(initial.phone);
    setCity(initial.city);
  }, [initial]);

  const dirty =
    name.trim() !== initial.name.trim() ||
    phone !== initial.phone ||
    city.trim() !== initial.city.trim();

  const leave = React.useCallback(() => {
    allowingLeave.current = true;
    navigation.goBack();
  }, [navigation]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (allowingLeave.current || !dirty) return;
      event.preventDefault();
      Alert.alert('Discard changes?', 'You have unsaved profile changes.', [
        {text: 'Keep editing', style: 'cancel'},
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            allowingLeave.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [dirty, navigation]);

  const save = useAsyncAction(async () => {
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2 || name.trim().length > 100) {
      nextErrors.name = 'Enter a name between 2 and 100 characters.';
    }
    if (phone && phone.length !== 10) {
      nextErrors.phone = 'Enter a 10-digit mobile number.';
    }
    if (city.trim().length > 100) {
      nextErrors.city = 'City must be 100 characters or fewer.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      throw new Error(Object.values(nextErrors)[0]);
    }

    const next = await repos.auth.updateMe({
      fullName: name.trim(),
      phone: phone ? `+91${phone}` : undefined,
      city: city.trim(),
    });
    useSessionStore.getState().setProfile(next);
    queryClient.setQueryData(queryKeys.profile(accountKey()), next);
    await queryClient.invalidateQueries({queryKey: ['home']});
    leave();
  });

  const initialLetter = name.trim().charAt(0).toUpperCase() || 'R';

  return (
    <Screen padded={false}>
      <DetailHeader
        title="Edit Profile"
        subtitle="Update your learner account"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save profile"
            disabled={save.busy || !dirty}
            onPress={() => void save.run()}
            hitSlop={8}
            style={({pressed}) => [{opacity: save.busy || !dirty ? 0.45 : pressed ? 0.7 : 1}]}>
            <AppText weight="700" size={11.5} color={colors.primary}>
              {save.busy ? 'Saving…' : 'Save'}
            </AppText>
          </Pressable>
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.editPage}>
        <View style={styles.editIdentity}>
          <Gradient
            colors={gradients.avatar}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.editAvatar}>
            <AppText weight="900" size={30} color={colors.white}>
              {initialLetter}
            </AppText>
          </Gradient>
          <AppText size={10.5} color={colors.text2}>
            Profile photos are not supported by the learner API.
          </AppText>
        </View>

        <EditField
          label="Full Name"
          icon="user"
          value={name}
          onChangeText={setName}
          maxLength={100}
          autoComplete="name"
          error={fieldErrors.name}
        />
        <EditField
          label="Email (read-only)"
          icon="globe"
          value={initial.email}
          editable={false}
        />
        <EditField
          label="Phone Number"
          icon="edit"
          prefix="+91"
          value={phone}
          onChangeText={text => setPhone(text.replace(/\D/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          maxLength={10}
          error={fieldErrors.phone}
        />
        <EditField
          label="City"
          icon="pin"
          value={city}
          onChangeText={setCity}
          maxLength={100}
          autoComplete="postal-address-locality"
          error={fieldErrors.city}
        />

        {save.error ? (
          <AppText accessibilityRole="alert" size={11} color={colors.error}>
            {save.error}
          </AppText>
        ) : null}

        <View style={styles.editDual}>
          <Pressable
            accessibilityRole="button"
            onPress={leave}
            style={({pressed}) => [styles.editBtnOut, pressed && styles.pressed, styles.editDualBtn]}>
            <AppText weight="800" size={12} color={colors.primary}>
              Cancel
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={save.busy || !dirty}
            onPress={() => void save.run()}
            style={({pressed}) => [
              styles.editDualBtn,
              {opacity: save.busy || !dirty ? 0.55 : pressed ? 0.9 : 1},
            ]}>
            <Gradient colors={gradients.primaryButton} style={styles.editBtnSolid}>
              <Icon name="check" size={14} color="#fff" />
              <AppText weight="800" size={12} color="#fff">
                {save.busy ? 'Saving…' : 'Save Changes'}
              </AppText>
            </Gradient>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function EditField({
  label,
  icon,
  prefix,
  error,
  ...rest
}: TextInputProps & {
  label: string;
  icon: IconName;
  prefix?: string;
  error?: string;
}) {
  return (
    <View style={styles.editField}>
      <AppText weight="800" size={9.5} color={colors.text2} style={styles.editLabel}>
        {label}
      </AppText>
      <View style={styles.editInput}>
        <Icon name={icon} size={15} color={colors.text3} />
        {prefix ? (
          <AppText weight="700" size={11.5} color={colors.primary} style={styles.editPrefix}>
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          {...rest}
          placeholderTextColor={colors.text3}
          style={[styles.editInputText, rest.style]}
        />
      </View>
      {error ? (
        <AppText size={10.5} color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
