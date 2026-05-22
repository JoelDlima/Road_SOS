/// <reference types="jest" />
describe('Notifications Module', () => {
  it('exports setupNotifications and sendLocalNotification', () => {
    const mod = require('../../lib/notifications');
    expect(mod.setupNotifications).toBeDefined();
    expect(mod.sendLocalNotification).toBeDefined();
  });
});
