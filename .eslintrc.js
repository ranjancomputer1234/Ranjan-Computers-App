module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {files: ['scripts/*.cjs'], parserOptions: {ecmaVersion: 2020}, env: {node: true}},
    {
      files: ['**/jest.setup.js', '**/__tests__/**'],
      env: {jest: true},
    },
  ],
};
