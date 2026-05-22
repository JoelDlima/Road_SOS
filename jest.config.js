module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|@sentry/.*)',
  ],
  // setupFiles runs BEFORE the test framework is installed, so Jest globals
  // like `expect` and `jest` are not yet defined. Matcher extensions (which
  // call `expect.extend(...)`) must therefore go in setupFilesAfterEnv.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/android/**',
    '!**/ios/**',
  ],
};
