import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import {getPreference, setPreference} from '../../core/storage';

const STORAGE_CONSENT = 'downloadStorageConsent';

function confirmPrivateStorage(): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      'Save courses on this device',
      'RACI stores downloaded courses privately in the app, only for your account. Allow storage to keep this course on the device.',
      [
        {text: 'Not now', style: 'cancel', onPress: () => resolve(false)},
        {text: 'Allow', onPress: () => resolve(true)},
      ],
      {cancelable: false},
    );
  });
}

function denied(): Error {
  return new Error('Storage access is off, so this course was not saved.');
}

/**
 * Asks before a course file is written.
 * Android 12 and below show the system storage prompt. Newer Android versions
 * keep course files in app-private storage, which has no system storage prompt,
 * so the learner is asked once in the app instead.
 */
export async function ensureCourseStorage(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const sdk = Number(Platform.Version);
  if (!Number.isFinite(sdk) || sdk >= 33) {
    if (await getPreference(STORAGE_CONSENT, false)) return;
    const allowed = await confirmPrivateStorage();
    if (!allowed) throw denied();
    await setPreference(STORAGE_CONSENT, true);
    return;
  }

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  if (await PermissionsAndroid.check(permission)) return;
  const result = await PermissionsAndroid.request(permission, {
    title: 'Save courses on this device',
    message: 'RACI needs storage access to download a course and keep it on this device.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  if (result === PermissionsAndroid.RESULTS.GRANTED) return;
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Allow storage',
      'Storage access is off. Turn it on in Settings to download courses and keep them on this device.',
      [
        {text: 'Not now', style: 'cancel'},
        {text: 'Open settings', onPress: () => { Linking.openSettings().catch(() => undefined); }},
      ],
    );
  }
  throw denied();
}
