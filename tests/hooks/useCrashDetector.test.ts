/// <reference types="jest" />
describe('useCrashDetector', () => {
  it('exports expected interface', () => {
    const mod = require('../../hooks/useCrashDetector');
    expect(mod.useCrashDetector).toBeDefined();
    expect(typeof mod.useCrashDetector).toBe('function');
  });
});

describe('useSOSFlow', () => {
  it('exports expected interface', () => {
    const mod = require('../../hooks/useSOSFlow');
    expect(mod.useSOSFlow).toBeDefined();
    expect(typeof mod.useSOSFlow).toBe('function');
  });
});

describe('useLocation', () => {
  it('exports expected interface', () => {
    const mod = require('../../hooks/useLocation');
    expect(mod.useLocation).toBeDefined();
    expect(typeof mod.useLocation).toBe('function');
  });
});

describe('useNearbyServices', () => {
  it('exports expected interface', () => {
    const mod = require('../../hooks/useNearbyServices');
    expect(mod.useNearbyServices).toBeDefined();
    expect(typeof mod.useNearbyServices).toBe('function');
  });
});
