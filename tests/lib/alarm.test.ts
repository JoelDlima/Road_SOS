/// <reference types="jest" />
describe('Alarm Module', () => {
  it('exports playAlarm and stopAlarm', () => {
    const mod = require('../../lib/alarm');
    expect(mod.playAlarm).toBeDefined();
    expect(mod.stopAlarm).toBeDefined();
    expect(typeof mod.playAlarm).toBe('function');
    expect(typeof mod.stopAlarm).toBe('function');
  });
});
