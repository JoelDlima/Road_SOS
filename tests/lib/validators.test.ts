/// <reference types="jest" />
import { validatePhone, isValidPhone, validateEmail, isValidEmail, validateName } from '../../lib/validators';

describe('validatePhone', () => {
  it.each([
    ['+91 98765 43210', true],
    ['9876543210', true],
    ['(415) 555-1234', true],
    ['+1-555-555-5555', true],
    ['1234567', true],
  ])('accepts valid phone "%s"', (input, expected) => {
    expect(validatePhone(input).valid).toBe(expected);
  });

  it.each([
    ['', 'Phone number is required'],
    ['   ', 'Phone number is required'],
    ['abc', 'Only digits, spaces, +, -, () allowed'],
    ['12345', 'Enter at least 7 digits'],
    ['1234567890123456', 'Maximum 15 digits'],
  ])('rejects "%s" with error "%s"', (input, errMessage) => {
    const result = validatePhone(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(errMessage);
  });

  it('isValidPhone is a boolean wrapper', () => {
    expect(isValidPhone('+91 98765 43210')).toBe(true);
    expect(isValidPhone('abc')).toBe(false);
  });
});

describe('validateEmail', () => {
  it.each([
    'user@example.com',
    'a.b.c@d.co',
    'first+tag@subdomain.example.org',
  ])('accepts valid email "%s"', (input) => {
    expect(validateEmail(input).valid).toBe(true);
  });

  it.each([
    '',
    'not-an-email',
    '@nope.com',
    'name@',
    'name@nope',
  ])('rejects invalid email "%s"', (input) => {
    expect(validateEmail(input).valid).toBe(false);
  });

  it('isValidEmail is a boolean wrapper', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
  });
});

describe('validateName', () => {
  it('accepts a real name', () => {
    expect(validateName('Alice').valid).toBe(true);
    expect(validateName('  Alice Smith  ').valid).toBe(true);
  });

  it('rejects empty / whitespace-only names', () => {
    expect(validateName('').valid).toBe(false);
    expect(validateName('   ').valid).toBe(false);
  });

  it('rejects single-character names', () => {
    expect(validateName('A').valid).toBe(false);
    expect(validateName('A').error).toBe('Name is too short');
  });
});
