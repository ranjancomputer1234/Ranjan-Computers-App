import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const INSTALLATION_KEY = 'redi.installation.id';

function createId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function learnerDeviceIdentity(): Promise<{deviceId: string; installationId: string}> {
  let installationId = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (!installationId) {
    installationId = createId();
    await AsyncStorage.setItem(INSTALLATION_KEY, installationId);
  }
  return {
    installationId,
    deviceId: `${Platform.OS}-${installationId}`,
  };
}
