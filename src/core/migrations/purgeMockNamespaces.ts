import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Idempotent cleanup for installations that previously ran with mock data.
 * Kept after source fixtures are removed so upgraded devices purge legacy keys
 * before authenticated content hydrates.
 *
 * Identifiers only — no legacy payloads.
 */
export const MOCK_PURGE_MIGRATION_ID = 'purge-mock-namespaces-v1';

const LEGACY_MOCK_KEY_PREFIXES = [
  'redi:mock:',
  'redi.prefs.mock.',
  'redi.prefs.mock_learner_',
  'redi.purchase.mock_',
];

const LEGACY_EXACT_KEYS = ['redi.prefs.mock.paymentScenario'];

export async function purgeMockNamespaces(): Promise<{
  removedKeys: string[];
  alreadyDone: boolean;
}> {
  const markerKey = `redi.migration.${MOCK_PURGE_MIGRATION_ID}`;
  const done = await AsyncStorage.getItem(markerKey);
  if (done === 'done') {
    return {removedKeys: [], alreadyDone: true};
  }

  const allKeys = await AsyncStorage.getAllKeys();
  const doomed = allKeys.filter(
    key =>
      LEGACY_EXACT_KEYS.includes(key) ||
      LEGACY_MOCK_KEY_PREFIXES.some(prefix => key.startsWith(prefix)) ||
      key.includes(':mock:') ||
      /^redi\.purchase\.mock_/i.test(key),
  );

  if (doomed.length) {
    await Promise.all(doomed.map(key => AsyncStorage.removeItem(key)));
  }

  await AsyncStorage.setItem(markerKey, 'done');
  return {removedKeys: [...doomed], alreadyDone: false};
}
