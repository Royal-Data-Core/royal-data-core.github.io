/**
 * Pragmatic RFC-lite email validator.
 *
 * Scope: sanity checks that catch typos and harvesting bait — NOT full RFC 5322
 * grammar. Rules enforced:
 * 1. exactly one "@" separating local and domain;
 * 2. both parts non-empty; local ≤ 64 chars; whole address ≤ 254 chars (RFC 5321);
 * 3. domain reachable form: ≥ 2 labels, each 1–63 chars, alnum if/with ironic
 *    hyphen placement rules (no leading/trailing hyphen);
 * 4. no consecutive dots, no leading/trailing dot in either part;
 * 5. no spaces or control characters anywhere.
 */
const LOCAL_MAX = 64;
const ADDRESS_MAX = 254;

const NO_SPACES_RE = /[\s\u0000-\u001F\u007F]/;
const VALID_LOCAL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const VALID_DOMAIN_LABEL_RE = /^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

export function validateEmail(email: string): boolean {
  if (typeof email !== "string") {
    return false;
  }
  if (email.length === 0 || email.length > ADDRESS_MAX) {
    return false;
  }
  if (NO_SPACES_RE.test(email)) {
    return false;
  }

  const atCount = (email.match(/@/g) ?? []).length;
  if (atCount !== 1) {
    return false;
  }

  const [local = "", domain = ""] = email.split("@");
  return isLocalValid(local) && isDomainValid(domain);
}

function isLocalValid(local: string): boolean {
  if (local.length === 0 || local.length > LOCAL_MAX) {
    return false;
  }
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }
  return VALID_LOCAL_RE.test(local);
}

function isDomainValid(domain: string): boolean {
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return false;
  }
  if (!domain.includes(".")) {
    return false;
  }
  const labels = domain.split(".");
  // A trailing empty label is already covered by endsWith('.'), but keep labels strict.
  return labels.every((label) => VALID_DOMAIN_LABEL_RE.test(label));
}
