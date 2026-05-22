/// <reference types="jest" />
describe('Project Configuration', () => {
  it('package.json has required dependencies', () => {
    const pkg = require('../package.json');
    const deps = Object.keys(pkg.dependencies);
    expect(deps).toContain('expo');
    expect(deps).toContain('react');
    expect(deps).toContain('react-native');
    expect(deps).toContain('expo-router');
    expect(deps).toContain('expo-sms');
    expect(deps).toContain('expo-sensors');
    expect(deps).toContain('@react-native-async-storage/async-storage');
  });

  it('has correct TypeScript config', () => {
    const tsconfig = require('../tsconfig.json');
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.resolveJsonModule).toBe(true);
  });
});
