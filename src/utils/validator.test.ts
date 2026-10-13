import { describe, it, expect } from 'vitest';
import { validateEmail } from './validator';

describe('Email Validator', () => {
  it('should validate valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});