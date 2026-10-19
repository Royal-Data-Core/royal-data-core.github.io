import { describe, it, expect } from "vitest";
import { validateEmail } from "./validator";

describe("Email Validator", () => {
  it("should validate valid email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
  });

  it("should reject invalid email", () => {
    expect(validateEmail("invalid-email")).toBe(false);
  });

  // Additional pragmatic cases (same file, same exported API):
  it("should reject consecutive dots", () => {
    expect(validateEmail("a..b@example.com")).toBe(false);
  });

  it("should reject overlong local part (RFC 5321 cap)", () => {
    expect(validateEmail(`${"a".repeat(65)}@example.com`)).toBe(false);
  });

  it("should accept plus addressing and dot in local part", () => {
    expect(validateEmail("qa.person+filter@example.com.br")).toBe(true);
  });
});

/**
 * Guard-branch block — qa-shiftleft / static-analysis-enforcer audit. One
 * `it()` per uncovered return-guard in src/utils/validator.ts (lines 22, 25,
 * 28, 52, 55, 58), authored strictly against the source lines 15-60. The five
 * tests above are untouched.
 */
describe("Email Validator — guard branches (validator.ts:22/25/28/52/55/58)", () => {
  // :22 — typeof guard: only real strings may proceed.
  it("should reject non-string input (number, null, undefined, object)", () => {
    expect(validateEmail(42 as unknown as string)).toBe(false);
    expect(validateEmail(null as unknown as string)).toBe(false);
    expect(validateEmail(undefined as unknown as string)).toBe(false);
    expect(
      validateEmail({ local: "a", domain: "example.com" } as unknown as string),
    ).toBe(false);
  });

  // :25 — address-length guard: empty string OR total length > 254 (RFC 5321).
  it("should reject empty address and address exceeding the 254-char RFC 5321 cap", () => {
    expect(validateEmail("")).toBe(false);
    // 64-char local (at the cap) + '@' + 191-char domain = 256 chars > 254.
    expect(validateEmail(`${"a".repeat(64)}@${"b".repeat(191)}`)).toBe(false);
  });

  // :28 — NO_SPACES_RE: no whitespace or C0/C1 control characters anywhere.
  it("should reject whitespace and control characters in any position", () => {
    expect(validateEmail("a b@example.com")).toBe(false); // interior space
    expect(validateEmail(" a@example.com")).toBe(false); // leading space
    expect(validateEmail("a@example.com\n")).toBe(false); // LF control char
    expect(validateEmail("a@exa\u0000mple.com")).toBe(false); // NUL control char
    expect(validateEmail("a@exam\u007Fple.com")).toBe(false); // DEL control char
  });

  // :52 — domain-length guard. Reachable sub-guard: empty domain from a
  // dangling '@'. NOTE: the >253 sub-guard is unreachable behind :24's
  // 254-char total cap (a ≤254-char address implies domain ≤ 252) — defensive
  // dead code; the over-long-domain expectation below still exits false,
  // but via :25, and is kept only to pin that behavior.
  it('should reject dangling "@" with empty domain (over-253 domain exits at :25 first)', () => {
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail(`a@${"b".repeat(254)}`)).toBe(false);
  });

  // :55 — domain dot anomalies: leading, trailing, or consecutive dot.
  it("should reject domain with leading dot, trailing dot, or consecutive dots", () => {
    expect(validateEmail("a@example..com")).toBe(false); // consecutive dots
    expect(validateEmail("a@.example.com")).toBe(false); // leading dot
    expect(validateEmail("a@example.com.")).toBe(false); // trailing dot
  });

  // :58 — single-label domain: a dot is required to form >= 2 labels.
  it("should reject domain without a dot (single label, e.g. localhost)", () => {
    expect(validateEmail("user@localhost")).toBe(false);
  });
});
