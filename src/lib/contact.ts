/**
 * SPEC-005 / ADR-003 — contact channel resolution.
 *
 * D-03 (SDD-CONTEXT §9) RESOLVED 2026-10-20: `PUBLIC_CONTACT_EMAIL` /
 * `PUBLIC_CONTACT_PHONE` are now set at build time (CI workflow env + local
 * `.env`). The SSOT placeholder path still exists for builds without the
 * values (literal `[[EMAIL]]` / `[[PHONE]]`) — inventing a real address or
 * number would violate CONSTITUTION §C9 and SDD-CONTEXT §1's binding
 * directive, and it still never happens.
 *
 * RRR-07 / ADR-003 D3: when a real email exists it is entity-encoded at BUILD
 * time (both `href` and visible text) so naive harvesting regexes over raw HTML
 * fail. This is obfuscation, not cryptography — no claim of "full protection"
 * is ever made to the user.
 */

import { withBase } from "./withBase";

const RAW_EMAIL = (import.meta.env.PUBLIC_CONTACT_EMAIL ?? "").trim();
const RAW_PHONE = (import.meta.env.PUBLIC_CONTACT_PHONE ?? "").trim();

/** D-03 pending-decision placeholders (exact SSOT strings). */
export const CONTACT_PLACEHOLDER_EMAIL = "[[EMAIL]]";
export const CONTACT_PLACEHOLDER_PHONE = "[[PHONE]]";

/** Real value or null. Never an invented value. */
export const CONTACT_EMAIL: string | null =
  RAW_EMAIL.length > 0 ? RAW_EMAIL : null;
export const CONTACT_PHONE: string | null =
  RAW_PHONE.length > 0 ? RAW_PHONE : null;

/**
 * D-04 (resolved 2026-10-20) — verified social channels: brand Instagram,
 * founder LinkedIn (operator ratified the strategy: a personal profile labeled
 * as founder is the strongest B2B trust anchor available; a company page can
 * replace it later), and the already-public GitHub profile. Used by /contato,
 * the footer and the JSON-LD `sameAs`. Verified data only (CONSTITUTION §C9).
 */
export const CONTACT_SOCIALS = {
  github: "https://github.com/royaldatacore",
  instagram: "https://www.instagram.com/royaldatacore",
  linkedin: "https://www.linkedin.com/in/leonardo-setti",
} as const;

/**
 * Display formatter for the verified Brazilian mobile shape: country (2) +
 * DDD (2) + 9-digit number = 13 digits, e.g. "5516997148778" →
 * "+55 (16) 99714-8778". Any other shape is displayed raw — never invented.
 */
export function buildPhoneDisplay(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return phone;
}

/** Display string: real value or the D-03 placeholder. */
export const CONTACT_EMAIL_DISPLAY = CONTACT_EMAIL ?? CONTACT_PLACEHOLDER_EMAIL;
/** Phone display: placeholder when pending; formatted BR mobile when real. */
export const CONTACT_PHONE_DISPLAY = CONTACT_PHONE
  ? buildPhoneDisplay(CONTACT_PHONE)
  : CONTACT_PLACEHOLDER_PHONE;

/** Build-time flag so templates can branch honestly instead of emitting broken hrefs. */
export const HAS_CONTACT_EMAIL = CONTACT_EMAIL !== null;
export const HAS_CONTACT_PHONE = CONTACT_PHONE !== null;

/** RFC 3966 `tel:` URI from a digits-only phone with country code, e.g. "5511999999999". */
export function buildTelHref(phone: string): string {
  return `tel:+${phone.replace(/[^0-9]/g, "")}`;
}

/** RFC 6068 `mailto:` URI with a pre-filled subject (ADR-003 D4 origin qualifier). */
export function buildMailtoHref(
  email: string,
  subject: string,
  body?: string,
): string {
  const params = new URLSearchParams({ subject });
  if (body) {
    params.set("body", body);
  }
  return `mailto:${email}?${params.toString()}`;
}

/**
 * Default pre-filled body: razão social + origin URL.
 * SPEC-005 AC-005.2 requires the body to contain razão social and the origin URL.
 */
export function defaultMailtoBody(originUrl: string): string {
  return `Enviado a partir do site oficial da Royal Data Core LTDA (${originUrl}).`;
}

/**
 * ADR-003 D3 — official WhatsApp deep-link with pre-filled text.
 * `text` is mandatory and non-empty (SPEC-005 AC-005.4).
 */
export function buildWhatsAppHref(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Encodes every character (including supplementary planes) as decimal entities. */
export function encodeHtmlEntities(value: string): string {
  if (value.length === 0) {
    return value;
  }
  const segments: string[] = [];
  for (const char of value) {
    segments.push(`&#${char.codePointAt(0)};`);
  }
  return segments.join("");
}

/**
 * Harvest-safe `mailto:` href (ADR-003 D3, rev. 2026-10-20): the address is
 * PERCENT-ENCODED ("@" → %40) so the regex `/[\w.+-]+@[\w-]+\./` finds no
 * match in raw HTML, while the URI stays 100% functional — browsers/mail
 * clients decode percent-octets per RFC 6068 at click time.
 * History: the previous approach encoded the address as HTML entities
 * (`&#114;…`) for the href ATTRIBUTE, but Astro's attribute binder re-escapes
 * `&` (source showed `&amp;#114;`) → the browser never decoded the address
 * and the mailto was dead on click. Latent since ADR-003 because no real
 * anchor existed before D-03; `%40` lives in URI space and is idempotent.
 * The VISIBLE text still uses `textEncoded` (entity-encoded, set:html) —
 * text NODES decode correctly, attributes do not.
 */
export function buildMailtoHrefEncoded(
  email: string,
  subject: string,
  body?: string,
): {
  href: string;
  hrefEncoded: string;
  textEncoded: string;
  addressDecoded: string;
} {
  const href = buildMailtoHref(email, subject, body);
  const sendLength = "mailto:".length;
  return {
    href,
    hrefEncoded: `mailto:${email.replace("@", "%40")}${href.slice(sendLength + email.length)}`,
    textEncoded: encodeHtmlEntities(email),
    addressDecoded: email,
  };
}

/**
 * ADR-003 D4 rev. 2026-10-21 — bracket-prefix foldering format: every PT-BR
 * subject is `[{{CTA_CTX}}] - Royal Data Core`, so mail clients folder by CTA
 * origin without analytics. Uniform "Royal Data Core" suffix; service
 * descriptors dropped by operator directive.
 */
export const CONTACT_SUBJECTS = {
  hero: "[CONTATO VIA SITE] - Royal Data Core",
  servicesB2B: "[CONSULTORIA QA B2B] - Royal Data Core",
  servicesClt: "[OPORTUNIDADE CLT QA] - Royal Data Core",
  general: "[CONTATO GERAL] - Royal Data Core",
  post: (slug: string) => `Sobre o artigo: ${slug}`,
  brokenLink: (path: string) => `Link quebrado — ${path}`,
} as const;

/**
 * SPEC-012 AC-012.6 — English subjects (EN locale). No CLT/alocação subject
 * exists here on purpose: the EN surface does not offer Brazilian employment
 * models (SPEC-012 §4 — delta matrix).
 */
export const CONTACT_SUBJECTS_EN = {
  hero: "Contact via site — Hero (EN)",
  servicesB2B: (service: string) => `QA consulting enquiry — ${service}`,
  general: "General enquiry — Royal Data Core (EN site)",
  post: (slug: string) => `About the article: ${slug}`,
  brokenLink: (path: string) => `Broken link — ${path}`,
} as const;

/**
 * SPEC-001/AC-001.8 guard for the pending-contact hint anchor: when contact data
 * is pending we route the CTA to `/contato` where the pending state is shown,
 * instead of emitting a dead `href`.
 */
export function contactFallbackHref(): string {
  return withBase("/contato");
}
