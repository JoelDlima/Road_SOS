/// <reference types="jest" />

jest.mock('expo-av', () => ({}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

describe('Theme module', () => {
  it('exports the public design tokens used across the app', () => {
    const theme = require('../../constants/theme');
    expect(theme.Colors).toBeDefined();
    expect(theme.Colors.sosRed).toBeDefined();
    expect(theme.Colors.background).toBeDefined();
    expect(theme.Colors.textPrimary).toBeDefined();

    expect(theme.Radius).toBeDefined();
    expect(theme.Radius.pill).toBeDefined();
    expect(theme.Radius.card).toBeDefined();

    expect(theme.Spacing).toBeDefined();
    expect(theme.Spacing.md).toBeDefined();

    expect(theme.Typography).toBeDefined();
    expect(theme.Typography.h1).toBeDefined();
    expect(theme.Typography.body).toBeDefined();

    expect(theme.ServiceTypeColors).toBeDefined();
    expect(theme.ServiceTypeLabels).toBeDefined();
  });

  it('Colors.sosRed is a valid hex string', () => {
    const { Colors } = require('../../constants/theme');
    expect(typeof Colors.sosRed).toBe('string');
    expect(Colors.sosRed).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('Types module', () => {
  it('loads without errors', () => {
    const types = require('../../types');
    expect(types).toBeDefined();
  });
});

describe('SOSButton component', () => {
  it('exports the SOSButton component', () => {
    const mod = require('../../components/SOSButton');
    expect(mod.SOSButton).toBeDefined();
  });
});
