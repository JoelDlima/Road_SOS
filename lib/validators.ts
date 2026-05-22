/**
 * Shared input validators.
 * Keep validation rules in one place so onboarding, settings, contacts,
 * and auth screens never disagree.
 */

const PHONE_DIGIT_MIN = 7;
const PHONE_DIGIT_MAX = 15;
const PHONE_ALLOWED_CHARS = /^[+\d\s\-()]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an emergency-contact phone number.
 * Accepts +, digits, spaces, dashes, parentheses. Requires 7-15 digits.
 */
export function validatePhone(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, error: 'Phone number is required' };
  if (!PHONE_ALLOWED_CHARS.test(trimmed)) {
    return { valid: false, error: 'Only digits, spaces, +, -, () allowed' };
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < PHONE_DIGIT_MIN) {
    return { valid: false, error: `Enter at least ${PHONE_DIGIT_MIN} digits` };
  }
  if (digits.length > PHONE_DIGIT_MAX) {
    return { valid: false, error: `Maximum ${PHONE_DIGIT_MAX} digits` };
  }
  return { valid: true };
}

/** Convenience boolean wrapper around validatePhone. */
export function isValidPhone(input: string): boolean {
  return validatePhone(input).valid;
}

/** Validates an email address. */
export function validateEmail(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, error: 'Email is required' };
  if (!EMAIL_RE.test(trimmed)) return { valid: false, error: 'Enter a valid email address' };
  return { valid: true };
}

export function isValidEmail(input: string): boolean {
  return validateEmail(input).valid;
}

/** Validates a full name: trimmed, at least 1 character. */
export function validateName(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, error: 'Name is required' };
  if (trimmed.length < 2) return { valid: false, error: 'Name is too short' };
  return { valid: true };
}
