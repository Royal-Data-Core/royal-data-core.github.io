import { describe, it, expect } from 'vitest';
import { validateEmail } from './validator';

describe('Email Validator', () => {
  it('should validate valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });

  // Additional pragmatic cases (same file, same exported API):
  it('should reject consecutive dots', () => {
    expect(validateEmail('a..b@example.com')).toBe(false);
  });

  it('should reject overlong local part (RFC 5321 cap)', () => {
    expect(validateEmail(`${'a'.repeat(65)}@example.com`)).toBe(false);
  });

  it('should accept plus addressing and dot in local part', () => {
    expect(validateEmail('qa.person+filter@example.com.br')).toBe(true);
  });
});
