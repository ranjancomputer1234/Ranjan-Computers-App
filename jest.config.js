module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/react-native/matchers'],
  modulePathIgnorePatterns: ['<rootDir>/vendor/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@tanstack|react-native-.*|zustand)/)',
  ],
};
