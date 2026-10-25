import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY'},
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    setItem: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    getItem: jest.fn(async key => store.get(key) ?? null),
    removeItem: jest.fn(async key => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
    getAllKeys: jest.fn(async () => [...store.keys()]),
    multiGet: jest.fn(async keys => keys.map(key => [key, store.get(key) ?? null])),
    multiSet: jest.fn(async pairs => {
      pairs.forEach(([key, value]) => store.set(key, value));
    }),
    multiRemove: jest.fn(async keys => {
      keys.forEach(key => store.delete(key));
    }),
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({isConnected: true})),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {dirs: {DocumentDir: '/tmp'}, exists: jest.fn(async () => false), unlink: jest.fn(async () => {})},
  config: () => ({fetch: jest.fn()}),
}));

jest.mock('react-native-video', () => 'Video');
jest.mock('react-native-screens', () => ({enableScreens: jest.fn()}));
